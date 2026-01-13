import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { format, parseISO } from 'date-fns'

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

  const { classId, firstName, lastName, phone, customerName } =
    session.metadata || {}

  if (!classId || !firstName || !lastName || !phone) {
    console.error('Missing metadata in checkout session')
    return
  }

  const phoneNormalized = phone.replace(/\D/g, '')

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

    // 2. Check if already booked (duplicate protection)
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('class_id', classId)
      .eq('guest_phone', phoneNormalized)
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

    // 3.5 Try to find a user account with matching phone number
    let matchedUserId: string | null = null
    const { data: matchedProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phoneNormalized)
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
        guest_phone: phoneNormalized,
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

    // 6. Send SMS confirmation
    try {
      const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':')
        const hour = parseInt(hours)
        const period = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour % 12 || 12
        return `${displayHour}:${minutes} ${period}`
      }

      await supabase.functions.invoke('send-sms-confirmation', {
        body: {
          to: `+${phoneNormalized}`,
          guestName: customerName || `${firstName} ${lastName}`,
          sessionTitle: yogaClass.title,
          sessionDate: format(
            parseISO(yogaClass.time_slot.date),
            'EEEE, MMM d, yyyy'
          ),
          sessionTime: formatTime(yogaClass.time_slot.start_time),
          venueName: 'PikkUp Studio',
          venueAddress: '2500 South Miami Avenue',
          cost: yogaClass.price_cents,
          bookingId: bookingData.id,
        },
      })
      console.log('SMS sent successfully')
    } catch (smsError) {
      console.error('SMS error:', smsError)
    }

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
  const { firstName, lastName, phone } = session.metadata || {}
  const phoneNormalized = phone?.replace(/\D/g, '') || ''

  const paymentData = {
    booking_id: bookingId,
    class_id: classId,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent as string,
    amount_cents: session.amount_total || 0,
    currency: session.currency || 'usd',
    status,
    customer_name: `${firstName} ${lastName}`,
    customer_phone: phoneNormalized,
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
