import { createServerClient } from '@/lib/supabase'
import { upsertSubscriber, type RolePreference } from '@/lib/lead-capture'
import { NextRequest, NextResponse } from 'next/server'
import { trackEmailEvent, enqueueEmailJob } from '@/lib/email-automation'

const FREE_PASS_COOKIE = 'free_pass_token'
const FREE_PASS_MAX_AGE = 30 * 60 // 30 minutes in seconds
const GATE_PASSED_COOKIE = 'pikkup_gate_passed'
const GATE_PASSED_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

/**
 * POST: Landing email gate — upsert subscriber, issue 30-min free pass, set HTTP-only cookie.
 * Body: { email: string, role_preference?: 'student' | 'instructor', resubscribe?: boolean }
 * If subscriber exists and is_active is false and resubscribe is not true, returns UNSUBSCRIBED.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      role_preference,
      resubscribe = false,
    } = body as { email?: string; role_preference?: RolePreference; resubscribe?: boolean }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ success: false, error: 'Invalid email address' }, { status: 400 })
    }

    const supabase = createServerClient()
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, is_active')
      .eq('email', normalizedEmail)
      .single()

    if (existing && existing.is_active === false && !resubscribe) {
      return NextResponse.json(
        {
          success: false,
          code: 'UNSUBSCRIBED',
          message: 'You previously unsubscribed—resubscribe to get offers',
        },
        { status: 200 }
      )
    }

    if (existing && existing.is_active === false && resubscribe) {
      await supabase
        .from('newsletter_subscribers')
        .update({ is_active: true, unsubscribed_at: null })
        .eq('email', normalizedEmail)
    }

    const result = await upsertSubscriber(normalizedEmail, {
      source: 'landing_gate',
      role_preference: role_preference ?? undefined,
      issueFreePass: true,
      freePassExpiryHours: 0.5, // 30 minutes
    })

    // --- NEW: Automation Triggers ---
    await trackEmailEvent(normalizedEmail, 'lead_captured', { source: 'landing_gate', role_preference })
    
    // Enqueue follow-up if no booking in 2h and 48h
    const { count: bookingCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('guest_email', normalizedEmail)
      .eq('status', 'confirmed')

    if (!bookingCount || bookingCount === 0) {
      const now = new Date()
      const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000)
      const fortyEightHoursLater = new Date(now.getTime() + 48 * 60 * 60 * 1000)
      
      await enqueueEmailJob(normalizedEmail, 'lead_no_booking_1', twoHoursLater, { firstName: result.first_name })
      await enqueueEmailJob(normalizedEmail, 'lead_no_booking_2', fortyEightHoursLater, { firstName: result.first_name })
    }
    // ---------------------------------

    const token = result.free_pass_token
    const redirectUrl = '/classes?free=1'

    const res = NextResponse.json({
      success: true,
      redirect: redirectUrl,
    })

    if (token) {
      res.cookies.set(FREE_PASS_COOKIE, token, {
        httpOnly: true,
        path: '/',
        maxAge: FREE_PASS_MAX_AGE,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
    }

    res.cookies.set(GATE_PASSED_COOKIE, '1', {
      path: '/',
      maxAge: GATE_PASSED_MAX_AGE,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    return res
  } catch (err) {
    console.error('Welcome claim error:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Something went wrong' },
      { status: 500 }
    )
  }
}

