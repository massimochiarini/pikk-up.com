import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Create profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
