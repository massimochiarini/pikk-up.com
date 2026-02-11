import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { verifyAdmin } from '@/lib/verify-admin'

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
        // Clear the application note after approval (it's temporary)
        updateData = { is_instructor: true, instructor_status: 'approved', instructor_application_note: null }
        break
      case 'reject':
        // Clear the application note after rejection (it's temporary)
        updateData = { is_instructor: false, instructor_status: 'rejected', instructor_application_note: null }
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
