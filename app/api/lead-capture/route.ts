import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST: Capture email (and optional name) from bio-link gate.
 * Upserts into newsletter_subscribers with source='bio', then optionally issues a first-class-free token.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, first_name: firstName } = body as { email?: string; first_name?: string }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Upsert subscriber with source = 'bio' (so they're in the same list for unsubscribe)
    const { data: subscriber, error: upsertError } = await supabaseAdmin
      .from('newsletter_subscribers')
      .upsert(
        {
          email: normalizedEmail,
          first_name: firstName?.trim() || null,
          source: 'bio',
          is_active: true,
        },
        { onConflict: 'email', ignoreDuplicates: false }
      )
      .select('id')
      .single()

    if (upsertError) {
      console.error('Lead capture upsert error:', upsertError)
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    // Issue a time-limited first-class-free token (e.g. 24 hours)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const { data: tokenRow, error: tokenError } = await supabaseAdmin
      .from('first_class_free_tokens')
      .insert({
        email: normalizedEmail,
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single()

    if (tokenError) {
      console.error('First-class-free token insert error:', tokenError)
      // Don't fail the request - capture succeeded; token is optional for analytics
    }

    const tokenId = tokenRow?.id ?? null
    return NextResponse.json({
      success: true,
      redirect: '/classes',
      token: tokenId, // Client can store in cookie/query for booking flow
    })
  } catch (err: unknown) {
    console.error('Lead capture error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
