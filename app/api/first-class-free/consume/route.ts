import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST { token: string, booking_id: string } — Mark token as used and link to booking.
 * Call after a free booking is successfully created using the token.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, booking_id: bookingId } = body as { token?: string; booking_id?: string }

    if (!token || !bookingId) {
      return NextResponse.json({ error: 'token and booking_id required' }, { status: 400 })
    }

    const { data: row, error: fetchError } = await supabaseAdmin
      .from('first_class_free_tokens')
      .select('id, used_at, expires_at')
      .eq('id', token)
      .single()

    if (fetchError || !row) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }

    if (row.used_at) {
      return NextResponse.json({ error: 'Token already used' }, { status: 400 })
    }

    const now = new Date().toISOString()
    if (row.expires_at < now) {
      return NextResponse.json({ error: 'Token expired' }, { status: 400 })
    }

    const { error: updateError } = await supabaseAdmin
      .from('first_class_free_tokens')
      .update({ used_at: now, booking_id: bookingId })
      .eq('id', token)

    if (updateError) {
      console.error('First-class-free consume update error:', updateError)
      return NextResponse.json({ error: 'Failed to consume token' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('First-class-free consume error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
