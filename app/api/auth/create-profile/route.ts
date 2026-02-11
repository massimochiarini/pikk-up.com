import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pikk-up.com'

async function sendWelcomeEmail(email: string, firstName: string) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set, skipping welcome email')
    return
  }

  const html = `
<!DOCTYPE html><html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 40px 20px;">
  <table role="presentation" style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <tr><td style="padding: 40px; text-align: center; border-bottom: 1px solid #f0f0f0;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 300; color: #1a1a1a;">PikkUp</h1>
    </td></tr>
    <tr><td style="padding: 30px 40px;">
      <p style="margin: 0 0 16px; font-size: 16px; color: #333;">Hi ${firstName},</p>
      <p style="margin: 0 0 16px; font-size: 15px; color: #555; line-height: 1.6;">Welcome to PickUp! Your account is all set up and you're ready to start booking yoga classes.</p>
      <p style="margin: 0 0 16px; font-size: 15px; color: #555; line-height: 1.6;">Here's what you can do:</p>
      <ul style="margin: 0 0 24px; padding-left: 20px; font-size: 15px; color: #555; line-height: 1.8;">
        <li>Browse and book upcoming classes</li>
        <li>Pay securely online</li>
        <li>Get reminders before your class</li>
      </ul>
      <a href="${SITE_URL}/classes" style="display: inline-block; padding: 12px 24px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px;">Browse classes</a>
    </td></tr>
    <tr>
      <td style="padding: 20px 40px; background-color: #fafafa; border-top: 1px solid #f0f0f0; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #999;">
          <a href="${SITE_URL}/unsubscribe?email=${encodeURIComponent(email)}" style="color: #999; text-decoration: underline;">Unsubscribe</a> from these emails
        </p>
      </td>
    </tr>
  </table>
</body></html>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Pick Up Yoga <bookings@pikk-up.com>',
        to: [email],
        subject: `Welcome to PickUp, ${firstName}!`,
        html,
      }),
    })
    if (res.ok) {
      console.log('Welcome email sent to:', email)
    } else {
      const err = await res.json()
      console.error('Welcome email failed:', err)
    }
  } catch (err) {
    console.error('Welcome email error:', err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId, 
      email, 
      firstName, 
      lastName, 
      isInstructor = false,
      instructorStatus = 'none',
      phone = null,
      instagram = null,
      bio = null,
      instructorApplicationNote = null
    } = body

    if (!userId || !email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Use service role client to bypass RLS (required for profile create/update)
    let supabase
    try {
      supabase = createServerClient()
    } catch (serverErr: any) {
      console.error('Create profile: server client init failed', serverErr?.message)
      return NextResponse.json(
        {
          error: 'Server configuration error. Please try again later or contact support.',
          code: 'MISSING_SERVICE_ROLE_KEY',
          hint: 'Site owner: add SUPABASE_SERVICE_ROLE_KEY to your deployment (e.g. Vercel → Settings → Environment Variables).',
        },
        { status: 503 }
      )
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (existingProfile) {
      // Profile exists, update it
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_instructor: isInstructor,
          instructor_status: instructorStatus,
          phone: phone || null,
          instagram: instagram || null,
          bio: bio || null,
          instructor_application_note: instructorApplicationNote || null,
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Profile update error:', updateError)
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 }
        )
      }
    } else {
      // Create new profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email,
          first_name: firstName,
          last_name: lastName,
          is_instructor: isInstructor,
          instructor_status: instructorStatus,
          phone: phone || null,
          instagram: instagram || null,
          bio: bio || null,
          instructor_application_note: instructorApplicationNote || null,
        })

      if (insertError) {
        console.error('Profile insert error:', insertError)
        return NextResponse.json(
          { error: 'Failed to create profile' },
          { status: 500 }
        )
      }
    }

    // Send welcome email via Resend
    await sendWelcomeEmail(email, firstName)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Create profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
