import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

const FREE_PASS_COOKIE = 'free_pass_token'

/**
 * GET: Validate free pass from HTTP-only cookie. Call with credentials: 'include'.
 * Returns { valid: boolean, email?: string }.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(FREE_PASS_COOKIE)?.value
    if (!token) {
      return NextResponse.json({ valid: false })
    }

    const supabase = createServerClient()
    const { data: row, error } = await supabase
      .from('newsletter_subscribers')
      .select('email, free_pass_expires_at, free_pass_used_at')
      .eq('free_pass_token', token)
      .single()

    if (error || !row) {
      return NextResponse.json({ valid: false })
    }

    const now = new Date().toISOString()
    const valid =
      row.free_pass_expires_at &&
      !row.free_pass_used_at &&
      row.free_pass_expires_at > now

    return NextResponse.json({
      valid: !!valid,
      email: valid ? row.email : undefined,
    })
  } catch {
    return NextResponse.json({ valid: false })
  }
}
