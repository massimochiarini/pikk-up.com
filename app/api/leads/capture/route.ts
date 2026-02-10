import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { upsertSubscriber, type RolePreference } from '@/lib/lead-capture'
import { trackEmailEvent, enqueueEmailJob } from '@/lib/email-automation'

// Simple in-memory rate limiting (v1 - soft limit)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_COUNT = 5
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (record.count >= RATE_LIMIT_COUNT) {
    return false
  }

  record.count += 1
  return true
}

/**
 * POST /api/leads/capture
 * Input: { email, firstName?, rolePreference?, source?, resubscribe? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      firstName,
      rolePreference,
      source = 'api_capture',
      resubscribe = false,
    } = body as {
      email?: string
      firstName?: string
      rolePreference?: RolePreference
      source?: string
      resubscribe?: boolean
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ ok: false, error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    
    // Rate limit check (IP and Email)
    if (!checkRateLimit(`ip:${ip}`) || !checkRateLimit(`email:${normalizedEmail}`)) {
      return NextResponse.json({ ok: false, error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    const supabase = createServerClient()
    
    // 1. Check existing subscriber status
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, is_active, free_pass_used_at')
      .eq('email', normalizedEmail)
      .single()

    // 2. Handle is_active logic: true only if not unsubscribed OR explicitly resubscribing
    let shouldReactivate = false
    if (existing && existing.is_active === false) {
      if (!resubscribe) {
        return NextResponse.json({
          ok: false,
          code: 'UNSUBSCRIBED',
          message: 'You previously unsubscribed. Please re-opt-in to receive offers.'
        }, { status: 200 })
      }
      shouldReactivate = true
    }

    if (shouldReactivate) {
      await supabase
        .from('newsletter_subscribers')
        .update({ is_active: true, unsubscribed_at: null })
        .eq('email', normalizedEmail)
    }

    // 3. Upsert using helper (handles source, role_preference, last_seen_at)
    // ONLY issue a token if they have never used a free pass
    const issueToken = !existing || existing.free_pass_used_at === null

    const result = await upsertSubscriber(normalizedEmail, {
      first_name: firstName,
      source,
      role_preference: rolePreference,
      issueFreePass: issueToken,
      freePassExpiryHours: 0.5, // 30 minutes
    })

    console.log(`Lead captured: ${normalizedEmail} from ${source}`)

    // --- NEW: Automation Triggers ---
    await trackEmailEvent(normalizedEmail, 'lead_captured', { source, rolePreference })
    
    // Enqueue follow-up if no booking in 2h and 48h
    // (Actual check for existing booking happens inside the runner edge function or before enqueueing)
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

    return NextResponse.json({
      ok: true,
      freePass: result.free_pass_token ? {
        token: result.free_pass_token,
        expiresAt: result.free_pass_expires_at
      } : null
    })

  } catch (err) {
    console.error('Leads capture error:', err)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

