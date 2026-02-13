import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { BOOKING_CUTOFF_DATE } from '@/lib/constants'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { format, parseISO } from 'date-fns'
import { trackEmailEvent, enqueueEmailJob, cancelEmailJobs } from '@/lib/email-automation'

// Lazy initialization to avoid build-time errors
let stripe: Stripe | null = null
let supabaseAdmin: SupabaseClient | null = null

function getStripe() {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  }
  return stripe
}

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  }
  return supabaseAdmin
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('No Stripe signature found')
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  console.log('Received Stripe webhook:', event.type)

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        )
        break

      case 'checkout.session.expired':
        console.log('Checkout session expired:', event.data.object.id)
        break

      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object.id)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  console.log('Checkout session completed:', session.id)

  const metadata = session.metadata || {}

  // Check if this is a package purchase
  if (metadata.type === 'package') {
    await handlePackagePurchase(session)
    return
  }

  // Otherwise, handle as class booking
  const { classId, firstName, lastName, email, customerName } = metadata

  if (!classId || !firstName || !lastName || !email) {
    console.error('Missing metadata in checkout session')
    return
  }

  const emailNormalized = email.toLowerCase().trim()

  try {
    const supabase = getSupabaseAdmin()
    
    // 1. Fetch class details
    const { data: yogaClass, error: classError } = await supabase
      .from('classes')
      .select(
        `
        *,
        time_slot:time_slots(*)
      `
      )
      .eq('id', classId)
      .single()

    if (classError) {
      console.error('Error fetching class:', classError)
      return
    }

    if (yogaClass.time_slot.date >= BOOKING_CUTOFF_DATE) {
      console.error('Booking closed: class date is after March 1st')
      await recordPayment(session, classId, null, 'failed', 'Booking closed. No classes can be booked after March 1st.')
      return
    }

    // 2. Check if already booked (duplicate protection by email)
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('class_id', classId)
      .eq('guest_email', emailNormalized)
      .eq('status', 'confirmed')
      .single()

    if (existingBooking) {
      console.log('Booking already exists, skipping duplicate')
      await recordPayment(session, classId, existingBooking.id)
      return
    }

    // 3. Check if class is full
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId)
      .eq('status', 'confirmed')

    if (count && count >= yogaClass.max_capacity) {
      console.error('Class is full, cannot create booking')
      await recordPayment(session, classId, null, 'failed', 'Class is full')
      return
    }

    // 3.5 Try to find a user account with matching email
    let matchedUserId: string | null = null
    const { data: matchedProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', emailNormalized)
      .single()
    
    if (matchedProfile) {
      matchedUserId = matchedProfile.id
      console.log('Found matching user account:', matchedUserId)
    }

    // 4. Create booking
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        class_id: classId,
        user_id: matchedUserId,
        guest_first_name: firstName.trim(),
        guest_last_name: lastName.trim(),
        guest_email: emailNormalized,
        status: 'confirmed',
      })
      .select()
      .single()

    if (bookingError) {
      console.error('Error creating booking:', bookingError)
      await recordPayment(
        session,
        classId,
        null,
        'failed',
        bookingError.message
      )
      return
    }

    console.log('Created booking:', bookingData.id)

    // 5. Record payment
    await recordPayment(session, classId, bookingData.id)

    // 6. Send email confirmation to guest email
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours)
      const period = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour % 12 || 12
      return `${displayHour}:${minutes} ${period}`
    }
    try {
      await supabase.functions.invoke('send-email-confirmation', {
        body: {
          to: emailNormalized,
          guestName: customerName || `${firstName} ${lastName}`,
          sessionTitle: yogaClass.title,
          sessionDate: format(
            parseISO(yogaClass.time_slot.date),
            'EEEE, MMM d, yyyy'
          ),
          sessionTime: formatTime(yogaClass.time_slot.start_time),
          venueName: 'PickUp Studio',
          venueAddress: '2500 South Miami Avenue',
          cost: yogaClass.price_cents,
          bookingId: bookingData.id,
        },
      })
      console.log('Email confirmation sent to:', emailNormalized)
    } catch (emailError) {
      console.error('Email confirmation error:', emailError)
    }

    // --- NEW: Trigger Automations ---
    try {
      const { data: instructorInfo } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', yogaClass.instructor_id)
        .single()

      // 1. Track 'booked' event
      await trackEmailEvent(emailNormalized, 'booked', { 
        booking_id: bookingData.id, 
        class_id: classId,
        instructor_id: yogaClass.instructor_id 
      })

      // 2. Cancel lead_no_booking jobs
      await cancelEmailJobs(emailNormalized, ['lead_no_booking_1', 'lead_no_booking_2'])

      // 3. Enqueue pre_class_reminder (24h before)
      const classStart = parseISO(`${yogaClass.time_slot.date}T${yogaClass.time_slot.start_time}`)
      const reminderTime = new Date(classStart.getTime() - 24 * 60 * 60 * 1000)
      
      if (reminderTime > new Date()) {
        await enqueueEmailJob(emailNormalized, 'pre_class_reminder', reminderTime, {
          bookingId: bookingData.id,
          firstName: firstName.trim(),
          sessionTitle: yogaClass.title,
          instructorName: instructorInfo?.first_name || 'your instructor',
          sessionTime: `${format(classStart, 'EEEE, MMM d')} at ${yogaClass.time_slot.start_time}`,
        })
      }

      // 4. Enqueue post_class_followup (3h after)
      const classEnd = parseISO(`${yogaClass.time_slot.date}T${yogaClass.time_slot.end_time || yogaClass.time_slot.start_time}`)
      const followupTime = new Date(classEnd.getTime() + 3 * 60 * 60 * 1000)
      
      await enqueueEmailJob(emailNormalized, 'post_class_followup', followupTime, {
        bookingId: bookingData.id,
        firstName: firstName.trim(),
        sessionTitle: yogaClass.title,
        instructorName: instructorInfo?.first_name || 'your instructor',
      })
    } catch (autoError) {
      console.error('Automation trigger error:', autoError)
    }
    // ---------------------------------

    console.log('Checkout session processing complete')
  } catch (error) {
    console.error('Error in handleCheckoutSessionCompleted:', error)
  }
}

async function recordPayment(
  session: Stripe.Checkout.Session,
  classId: string,
  bookingId: string | null,
  status: string = 'succeeded',
  errorMessage?: string
) {
  const { firstName, lastName, email } = session.metadata || {}

  const paymentData = {
    booking_id: bookingId,
    class_id: classId,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent as string,
    amount_cents: session.amount_total || 0,
    currency: session.currency || 'usd',
    status,
    customer_name: `${firstName} ${lastName}`,
    customer_email: email?.toLowerCase().trim() || '',
    error_message: errorMessage,
    paid_at: status === 'succeeded' ? new Date().toISOString() : null,
  }

  const { error: paymentError } = await getSupabaseAdmin()
    .from('payments')
    .insert(paymentData)

  if (paymentError) {
    console.error('Error recording payment:', paymentError)
  } else {
    console.log('Payment recorded:', session.id)
  }
}

async function handlePackagePurchase(session: Stripe.Checkout.Session) {
  console.log('Processing package purchase:', session.id)

  const {
    packageId,
    instructorId,
    classCount,
    firstName,
    lastName,
    email,
    userId,
    customerName,
  } = session.metadata || {}

  if (!packageId || !instructorId || !classCount || !firstName || !lastName || !email) {
    console.error('Missing metadata in package purchase session')
    return
  }

  const emailNormalized = email.toLowerCase().trim()
  const classCountNum = parseInt(classCount, 10)

  try {
    const supabase = getSupabaseAdmin()

    // 1. Verify package exists
    const { data: packageData, error: packageError } = await supabase
      .from('instructor_packages')
      .select('*')
      .eq('id', packageId)
      .single()

    if (packageError || !packageData) {
      console.error('Package not found:', packageError)
      return
    }

    // 2. Try to find a user account with matching email or use provided userId
    let matchedUserId: string | null = userId || null
    if (!matchedUserId) {
      const { data: matchedProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', emailNormalized)
        .single()

      if (matchedProfile) {
        matchedUserId = matchedProfile.id
        console.log('Found matching user account:', matchedUserId)
      }
    }

    // 3. Check for duplicate purchase (same session ID)
    const { data: existingCredit } = await supabase
      .from('package_credits')
      .select('id')
      .eq('stripe_checkout_session_id', session.id)
      .single()

    if (existingCredit) {
      console.log('Package credit already exists, skipping duplicate')
      return
    }

    // 4. Create package credit record
    const { data: creditData, error: creditError } = await supabase
      .from('package_credits')
      .insert({
        package_id: packageId,
        instructor_id: instructorId,
        user_id: matchedUserId,
        guest_email: emailNormalized,
        classes_remaining: classCountNum,
        classes_total: classCountNum,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        purchased_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (creditError) {
      console.error('Error creating package credit:', creditError)
      return
    }

    console.log('Created package credit:', creditData.id)

    // 5. Get instructor details for email
    const { data: instructor } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', instructorId)
      .single()

    // 6. Send email confirmation for package purchase
    try {
      await supabase.functions.invoke('send-email-confirmation', {
        body: {
          to: emailNormalized,
          guestName: customerName || `${firstName} ${lastName}`,
          sessionTitle: `${packageData.name} (${classCountNum} Classes)`,
          sessionDate: 'Package Purchase',
          sessionTime: `${classCountNum} class credits with ${instructor ? `${instructor.first_name} ${instructor.last_name}` : 'Instructor'}`,
          venueName: 'PickUp Studio',
          venueAddress: '2500 South Miami Avenue',
          cost: session.amount_total || 0,
          bookingId: creditData.id,
        },
      })
      console.log('Package purchase email sent to:', emailNormalized)
    } catch (emailError) {
      console.error('Package email error:', emailError)
    }

    console.log('Package purchase processing complete')
  } catch (error) {
    console.error('Error in handlePackagePurchase:', error)
  }
}
