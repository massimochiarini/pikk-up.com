import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { trackEmailEvent, enqueueEmailJob, cancelEmailJobs } from '@/lib/email-automation'
import { format, parseISO } from 'date-fns'

/**
 * POST /api/bookings/trigger-automation
 * Triggers automations after a booking is confirmed.
 */
export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json()

    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'bookingId is required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // 1. Fetch booking with class and instructor details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        classes (
          title,
          instructor_id,
          time_slot:time_slots (
            date,
            start_time,
            end_time
          ),
          instructor:profiles!classes_instructor_id_fkey (
            first_name,
            last_name
          )
        )
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      console.error('Error fetching booking for automation:', bookingError)
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    const email = booking.guest_email.toLowerCase().trim()
    const firstName = booking.guest_first_name || 'there'
    const yogaClass = booking.classes
    const instructor = yogaClass.instructor
    const timeSlot = yogaClass.time_slot

    // 2. Track 'booked' event
    await trackEmailEvent(email, 'booked', { 
      booking_id: bookingId, 
      class_id: booking.class_id,
      instructor_id: yogaClass.instructor_id 
    })

    // 3. Cancel lead_no_booking jobs
    await cancelEmailJobs(email, ['lead_no_booking_1', 'lead_no_booking_2'])

    // 4. Enqueue pre_class_reminder (24h before)
    const classStart = parseISO(`${timeSlot.date}T${timeSlot.start_time}`)
    const reminderTime = new Date(classStart.getTime() - 24 * 60 * 60 * 1000)
    
    // Only schedule if it's in the future
    if (reminderTime > new Date()) {
      await enqueueEmailJob(email, 'pre_class_reminder', reminderTime, {
        bookingId,
        firstName,
        sessionTitle: yogaClass.title,
        instructorName: instructor.first_name,
        sessionTime: `${format(classStart, 'EEEE, MMM d')} at ${timeSlot.start_time}`,
      })
    }

    // 5. Enqueue post_class_followup (3h after)
    const classEnd = parseISO(`${timeSlot.date}T${timeSlot.end_time || timeSlot.start_time}`) // fallback if no end_time
    const followupTime = new Date(classEnd.getTime() + 3 * 60 * 60 * 1000)
    
    await enqueueEmailJob(email, 'post_class_followup', followupTime, {
      bookingId,
      firstName,
      sessionTitle: yogaClass.title,
      instructorName: instructor.first_name,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Trigger automation error:', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
