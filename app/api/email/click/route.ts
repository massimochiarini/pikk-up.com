import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { trackEmailEvent } from '@/lib/email-automation'

/**
 * GET /api/email/click
 * Query params: email, type, url
 * Tracks a click event and redirects to the target URL.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const type = searchParams.get('type') // campaign type
  const url = searchParams.get('url')

  if (!url) {
    return new NextResponse('Missing target URL', { status: 400 })
  }

  // Track event if email and type are present
  if (email && type) {
    try {
      // Since trackEmailEvent uses createServerClient, we can use it here
      await trackEmailEvent(email, 'clicked', { type, url })
    } catch (err) {
      console.error('Click tracking error:', err)
    }
  }

  // Redirect to destination
  return NextResponse.redirect(url)
}
