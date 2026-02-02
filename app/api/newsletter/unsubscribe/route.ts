import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Update subscriber to inactive
    const { error } = await supabaseAdmin
      .from('newsletter_subscribers')
      .update({
        is_active: false,
        unsubscribed_at: new Date().toISOString()
      })
      .eq('email', normalizedEmail)

    if (error) {
      console.error('Unsubscribe error:', error)
      return NextResponse.json(
        { error: 'Failed to unsubscribe' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Successfully unsubscribed' })
  } catch (error: any) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle GET for one-click unsubscribe from email headers
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.redirect(new URL('/unsubscribe?error=missing_email', request.url))
  }

  const normalizedEmail = email.toLowerCase().trim()

  await supabaseAdmin
    .from('newsletter_subscribers')
    .update({
      is_active: false,
      unsubscribed_at: new Date().toISOString()
    })
    .eq('email', normalizedEmail)

  return NextResponse.redirect(new URL(`/unsubscribe?success=true&email=${encodeURIComponent(email)}`, request.url))
}
