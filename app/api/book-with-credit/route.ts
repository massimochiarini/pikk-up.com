import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { format, parseISO } from 'date-fns'

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
    const { classId, firstName, lastName, phone, userId } = body

    // Validation
    if (!classId || !firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const phoneNormalized = phone.replace(/\D/g, '')
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

    // 2. Check if user has credits with this instructor
    const { data: availableCredits, error: creditsError } = await supabase
      .rpc('get_available_credits', {
        p_instructor_id: yogaClass.instructor_id,
        p_user_id: userId || null,
        p_phone: phoneNormalized,
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

    // 3. Check if already booked
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('class_id', classId)
      .eq('guest_phone', phoneNormalized)
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
        p_phone: phoneNormalized,
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
        guest_phone: phoneNormalized,
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

    // 7. Send SMS confirmation
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours)
      const period = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour % 12 || 12
      return `${displayHour}:${minutes} ${period}`
    }

    try {
      await supabase.functions.invoke('send-sms-confirmation', {
        body: {
          to: `+${phoneNormalized}`,
          guestName: `${firstName.trim()} ${lastName.trim()}`,
          sessionTitle: yogaClass.title,
          sessionDate: format(
            parseISO(yogaClass.time_slot.date),
            'EEEE, MMM d, yyyy'
          ),
          sessionTime: formatTime(yogaClass.time_slot.start_time),
          venueName: 'PikkUp Studio',
          venueAddress: '2500 South Miami Avenue',
          cost: 0, // Paid via package credit
          bookingId: bookingData.id,
          paidWithCredit: true,
        },
      })
    } catch (smsError) {
      console.error('SMS error:', smsError)
    }

    // 8. Send email confirmation (if we have an email)
    try {
      let userEmail: string | null = null
      if (userId) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .single()
        userEmail = userProfile?.email || null
      }

      if (userEmail) {
        await supabase.functions.invoke('send-email-confirmation', {
          body: {
            to: userEmail,
            guestName: `${firstName.trim()} ${lastName.trim()}`,
            sessionTitle: yogaClass.title,
            sessionDate: format(
              parseISO(yogaClass.time_slot.date),
              'EEEE, MMM d, yyyy'
            ),
            sessionTime: formatTime(yogaClass.time_slot.start_time),
            venueName: 'PikkUp Studio',
            venueAddress: '2500 South Miami Avenue',
            cost: 0,
            bookingId: bookingData.id,
            paidWithCredit: true,
          },
        })
        console.log('Email confirmation sent successfully')
      }
    } catch (emailError) {
      console.error('Email confirmation error:', emailError)
    }

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
