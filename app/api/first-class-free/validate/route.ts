import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET ?token=uuid — Validate first-class-free token (do not consume).
 * Returns { valid: boolean, email?: string }.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.json({ valid: false }, { status: 200 })
    }

    const { data: row, error } = await supabaseAdmin
      .from('first_class_free_tokens')
      .select('id, email, expires_at, used_at')
      .eq('id', token)
      .single()

    if (error || !row) {
      return NextResponse.json({ valid: false }, { status: 200 })
    }

    const now = new Date().toISOString()
    const valid = !row.used_at && row.expires_at > now
    return NextResponse.json({
      valid: !!valid,
      email: valid ? row.email : undefined,
    })
  } catch (err) {
    console.error('First-class-free validate error:', err)
    return NextResponse.json({ valid: false }, { status: 200 })
  }
}
