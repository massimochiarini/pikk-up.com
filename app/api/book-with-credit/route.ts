import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { format, parseISO } from 'date-fns'
import { BOOKING_CUTOFF_DATE } from '@/lib/constants'
import { trackEmailEvent, enqueueEmailJob, cancelEmailJobs } from '@/lib/email-automation'

let supabaseAdmin: SupabaseClient | null = null

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
  try {
    const body = await request.json()
    const { classId, firstName, lastName, email, userId } = body

    // Validation
    if (!classId || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const emailNormalized = email.toLowerCase().trim()
    const supabase = getSupabaseAdmin()

    // 1. Fetch class details
    const { data: yogaClass, error: classError } = await supabase
      .from('classes')
      .select(`
        *,
        time_slot:time_slots(*),
        instructor:profiles!instructor_id(id, first_name, last_name)
      `)
      .eq('id', classId)
      .single()

    if (classError || !yogaClass) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    if (yogaClass.time_slot.date >= BOOKING_CUTOFF_DATE) {
      return NextResponse.json(
        { error: 'Booking is closed. Only February classes can be booked.' },
        { status: 400 }
      )
    }

    // 2. Check if user has credits with this instructor
    const { data: availableCredits, error: creditsError } = await supabase
      .rpc('get_available_credits', {
        p_instructor_id: yogaClass.instructor_id,
        p_user_id: userId || null,
        p_email: emailNormalized,
      })

    if (creditsError) {
      console.error('Error checking credits:', creditsError)
      return NextResponse.json(
        { error: 'Failed to verify credits' },
        { status: 500 }
      )
    }

    if (!availableCredits || availableCredits < 1) {
      return NextResponse.json(
        { error: 'No available credits with this instructor' },
        { status: 400 }
      )
    }

    // 3. Check if already booked (by email)
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('class_id', classId)
      .eq('guest_email', emailNormalized)
      .eq('status', 'confirmed')
      .single()

    if (existingBooking) {
      return NextResponse.json(
        { error: 'Already booked for this class' },
        { status: 400 }
      )
    }

    // 4. Check if class is full
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId)
      .eq('status', 'confirmed')

    if (count && count >= yogaClass.max_capacity) {
      return NextResponse.json(
        { error: 'Class is full' },
        { status: 400 }
      )
    }

    // 5. Use the credit (decrement)
    const { data: usedCreditId, error: useError } = await supabase
      .rpc('use_package_credit', {
        p_instructor_id: yogaClass.instructor_id,
        p_user_id: userId || null,
        p_email: emailNormalized,
      })

    if (useError || !usedCreditId) {
      console.error('Error using credit:', useError)
      return NextResponse.json(
        { error: 'Failed to use credit' },
        { status: 500 }
      )
    }

    // 6. Create the booking
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        class_id: classId,
        user_id: userId || null,
        guest_first_name: firstName.trim(),
        guest_last_name: lastName.trim(),
        guest_email: emailNormalized,
        status: 'confirmed',
      })
      .select()
      .single()

    if (bookingError) {
      console.error('Error creating booking:', bookingError)
      // Note: Credit already decremented - in production you'd want a transaction
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      )
    }

    // 7. Send email confirmation to guest email
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
          guestName: `${firstName.trim()} ${lastName.trim()}`,
          sessionTitle: yogaClass.title,
          sessionDate: format(
            parseISO(yogaClass.time_slot.date),
            'EEEE, MMM d, yyyy'
          ),
          sessionTime: formatTime(yogaClass.time_slot.start_time),
          venueName: 'PickUp Studio',
          venueAddress: '2500 South Miami Avenue',
          cost: 0,
          bookingId: bookingData.id,
          paidWithCredit: true,
        },
      })
      console.log('Email confirmation sent to:', emailNormalized)
    } catch (emailError) {
      console.error('Email confirmation error:', emailError)
    }

    // --- NEW: Trigger Automations ---
    try {
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
          instructorName: yogaClass.instructor.first_name,
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
        instructorName: yogaClass.instructor.first_name,
      })
    } catch (autoError) {
      console.error('Automation trigger error:', autoError)
    }
    // ---------------------------------

    return NextResponse.json({
      success: true,
      booking: bookingData,
      creditsRemaining: availableCredits - 1,
    })
  } catch (error: any) {
    console.error('Book with credit error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to book with credit' },
      { status: 500 }
    )
  }
}
