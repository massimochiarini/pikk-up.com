import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Helper to verify admin status
async function verifyAdmin(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return { isAdmin: false, userId: null, error: 'Missing configuration' }
  }

  // Get the auth token from the request
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return { isAdmin: false, userId: null, error: 'No authorization header' }
  }

  const token = authHeader.replace('Bearer ', '')
  
  // Create a client with the user's token
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { isAdmin: false, userId: null, error: 'Invalid token' }
  }

  // Check if user is admin using service role
  const serverClient = createServerClient()
  const { data: profile, error: profileError } = await serverClient
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.is_admin) {
    return { isAdmin: false, userId: user.id, error: 'Not an admin' }
  }

  return { isAdmin: true, userId: user.id, error: null }
}

// GET /api/admin/users - List all users with optional filtering
export async function GET(request: NextRequest) {
  const { isAdmin, error } = await verifyAdmin(request)
  
  if (!isAdmin) {
    return NextResponse.json({ error: error || 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const filter = searchParams.get('filter') // 'pending', 'instructors', 'students', 'all'

  const supabase = createServerClient()
  
  let query = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // Apply filters
  if (filter === 'pending') {
    query = query.eq('instructor_status', 'pending')
  } else if (filter === 'instructors') {
    query = query.eq('is_instructor', true)
  } else if (filter === 'students') {
    query = query.eq('is_instructor', false)
  }

  const { data: users, error: fetchError } = await query

  if (fetchError) {
    console.error('Error fetching users:', fetchError)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }

  return NextResponse.json({ users })
}

// PATCH /api/admin/users - Update user role/status
export async function PATCH(request: NextRequest) {
  const { isAdmin, error } = await verifyAdmin(request)
  
  if (!isAdmin) {
    return NextResponse.json({ error: error || 'Unauthorized' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { userId, action } = body

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing userId or action' }, { status: 400 })
    }

    const supabase = createServerClient()

    let updateData: Record<string, any> = {}

    switch (action) {
      case 'approve':
        updateData = { is_instructor: true, instructor_status: 'approved' }
        break
      case 'reject':
        updateData = { is_instructor: false, instructor_status: 'rejected' }
        break
      case 'revoke':
        updateData = { is_instructor: false, instructor_status: 'none' }
        break
      case 'make_instructor':
        updateData = { is_instructor: true, instructor_status: 'approved' }
        break
      case 'make_admin':
        updateData = { is_admin: true }
        break
      case 'remove_admin':
        updateData = { is_admin: false }
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    return NextResponse.json({ user: updatedUser, success: true })
  } catch (err) {
    console.error('Admin users API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
