import { createServerClient } from '@/lib/supabase'
import { consumeFreePass } from '@/lib/lead-capture'
import { NextRequest, NextResponse } from 'next/server'

const FREE_PASS_COOKIE = 'free_pass_token'

/**
 * POST: Consume the free pass from the HTTP-only cookie.
 * Body: { booking_id: string }
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(FREE_PASS_COOKIE)?.value
    const body = await request.json()
    const { booking_id: bookingId } = body

    if (!token) {
      return NextResponse.json({ success: false, error: 'No free pass found' }, { status: 400 })
    }

    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'booking_id is required' }, { status: 400 })
    }

    const { success, error } = await consumeFreePass(token, bookingId)

    if (!success) {
      console.error('Consume free pass error:', error)
      return NextResponse.json({ success: false, error: 'Failed to consume pass' }, { status: 500 })
    }

    // Clear the cookie after consumption
    const res = NextResponse.json({ success: true })
    res.cookies.set(FREE_PASS_COOKIE, '', { maxAge: 0, path: '/' })
    
    return res
  } catch (err) {
    console.error('Consume pass error:', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
