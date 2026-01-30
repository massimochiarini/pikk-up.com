import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  }
  return supabaseAdmin
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, email, recipientName, waiverPdfUrl } = body

    // Must provide either userId or (email + recipientName)
    if (!userId && (!email || !recipientName)) {
      return NextResponse.json(
        { error: 'Must provide userId or (email + recipientName)' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Get the requesting user's session to verify they're an admin/instructor
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const { data: { user: requestingUser }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !requestingUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify requesting user is admin or instructor
    const { data: requestingProfile } = await supabase
      .from('profiles')
      .select('is_admin, is_instructor')
      .eq('id', requestingUser.id)
      .single()

    if (!requestingProfile?.is_admin && !requestingProfile?.is_instructor) {
      return NextResponse.json(
        { error: 'Only admins and instructors can send waivers' },
        { status: 403 }
      )
    }

    let targetEmail = email
    let targetName = recipientName

    // If userId provided, look up their email and name
    if (userId) {
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', userId)
        .single()

      if (profileError || !userProfile) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      if (!userProfile.email) {
        return NextResponse.json(
          { error: 'User does not have an email address' },
          { status: 400 }
        )
      }

      targetEmail = userProfile.email
      targetName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 'there'
    }

    // Send the waiver email via Edge Function
    const { data: emailResult, error: emailError } = await supabase.functions.invoke(
      'send-waiver-email',
      {
        body: {
          to: targetEmail,
          recipientName: targetName,
          waiverPdfUrl: waiverPdfUrl || undefined,
        },
      }
    )

    if (emailError) {
      console.error('Error sending waiver email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send waiver email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Waiver sent to ${targetEmail}`,
      emailId: emailResult?.emailId,
    })
  } catch (error: any) {
    console.error('Send waiver error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send waiver' },
      { status: 500 }
    )
  }
}

// GET endpoint to send waiver to all users who don't have one (batch operation)
// This is an admin-only endpoint
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()

    // Get the requesting user's session to verify they're an admin
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const { data: { user: requestingUser }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !requestingUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify requesting user is admin
    const { data: requestingProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', requestingUser.id)
      .single()

    if (!requestingProfile?.is_admin) {
      return NextResponse.json(
        { error: 'Only admins can use batch waiver sending' },
        { status: 403 }
      )
    }

    // Get all users with email addresses
    // In a production app, you might want to track who has already received/signed a waiver
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .not('email', 'is', null)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Send waiver to each user (in production, consider rate limiting)
    for (const user of users || []) {
      if (!user.email) continue

      try {
        await supabase.functions.invoke('send-waiver-email', {
          body: {
            to: user.email,
            recipientName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'there',
          },
        })
        results.sent++
      } catch (err: any) {
        results.failed++
        results.errors.push(`${user.email}: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Waivers sent to ${results.sent} users, ${results.failed} failed`,
      details: results,
    })
  } catch (error: any) {
    console.error('Batch waiver error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send batch waivers' },
      { status: 500 }
    )
  }
}
