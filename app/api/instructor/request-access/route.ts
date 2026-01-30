import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// POST /api/instructor/request-access - Request instructor access for existing user
export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Missing configuration' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { bio, instagram, phone, instructorApplicationNote } = body

    const serverClient = createServerClient()

    // Check current status
    const { data: profile, error: profileError } = await serverClient
      .from('profiles')
      .select('is_instructor, instructor_status')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    if (profile.is_instructor) {
      return NextResponse.json({ error: 'You are already an instructor' }, { status: 400 })
    }

    if (profile.instructor_status === 'pending') {
      return NextResponse.json({ error: 'Your request is already pending' }, { status: 400 })
    }

    // Update profile with request
    const { error: updateError } = await serverClient
      .from('profiles')
      .update({
        instructor_status: 'pending',
        bio: bio || null,
        instagram: instagram || null,
        phone: phone || null,
        instructor_application_note: instructorApplicationNote || null,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Request submitted for review' })
  } catch (err) {
    console.error('Request access API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
