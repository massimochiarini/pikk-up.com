import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { exchangeCodeForTokens } from '@/lib/google-calendar'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error)
      return NextResponse.redirect(
        `${siteUrl}/admin?calendar_error=${encodeURIComponent(error)}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${siteUrl}/admin?calendar_error=missing_params`
      )
    }

    // Decode and validate state
    let stateData: { userId: string; timestamp: number }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch {
      return NextResponse.redirect(
        `${siteUrl}/admin?calendar_error=invalid_state`
      )
    }

    // Check timestamp is within 10 minutes
    if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
      return NextResponse.redirect(
        `${siteUrl}/admin?calendar_error=expired`
      )
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      console.error('Missing tokens in response:', tokens)
      return NextResponse.redirect(
        `${siteUrl}/admin?calendar_error=missing_tokens`
      )
    }

    // Store tokens in database
    const supabase = createServerClient()
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        google_calendar_access_token: tokens.access_token,
        google_calendar_refresh_token: tokens.refresh_token,
        google_calendar_token_expiry: tokens.expiry_date 
          ? new Date(tokens.expiry_date).toISOString() 
          : null,
        google_calendar_connected: true,
      })
      .eq('id', stateData.userId)

    if (updateError) {
      console.error('Error storing tokens:', updateError)
      return NextResponse.redirect(
        `${siteUrl}/admin?calendar_error=storage_failed`
      )
    }

    // Redirect back to admin page with success message
    return NextResponse.redirect(
      `${siteUrl}/admin?calendar_connected=true`
    )
  } catch (error) {
    console.error('Google Calendar callback error:', error)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    return NextResponse.redirect(
      `${siteUrl}/admin?calendar_error=unknown`
    )
  }
}
