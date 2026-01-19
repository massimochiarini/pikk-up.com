import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { bookingId, userId, userPhone } = await request.json()

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
    }

    if (!userId && !userPhone) {
      return NextResponse.json({ error: 'User ID or phone is required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Fetch the booking to verify ownership
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, user_id, guest_phone, status, class_id')
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Booking is already cancelled' }, { status: 400 })
    }

    // Verify ownership: either user_id matches OR phone number matches
    const phoneNormalized = userPhone?.replace(/\D/g, '') || ''
    const isOwner = 
      (userId && booking.user_id === userId) ||
      (phoneNormalized && booking.guest_phone === phoneNormalized)

    if (!isOwner) {
      return NextResponse.json({ error: 'Not authorized to cancel this booking' }, { status: 403 })
    }

    // Cancel the booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Error cancelling booking:', updateError)
      return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 })
    }

    return NextResponse.json({ success: true, classId: booking.class_id })
  } catch (error) {
    console.error('Cancel booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
