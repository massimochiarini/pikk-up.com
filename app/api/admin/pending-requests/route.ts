import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Helper to verify admin status
async function verifyAdmin(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return { isAdmin: false, error: 'Missing configuration' }
  }

  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return { isAdmin: false, error: 'No authorization header' }
  }

  const token = authHeader.replace('Bearer ', '')
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { isAdmin: false, error: 'Invalid token' }
  }

  const serverClient = createServerClient()
  const { data: profile } = await serverClient
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return { isAdmin: false, error: 'Not an admin' }
  }

  return { isAdmin: true, error: null }
}

// GET /api/admin/pending-requests - Get pending instructor requests
export async function GET(request: NextRequest) {
  const { isAdmin, error } = await verifyAdmin(request)
  
  if (!isAdmin) {
    return NextResponse.json({ error: error || 'Unauthorized' }, { status: 403 })
  }

  const supabase = createServerClient()
  
  const { data: pendingRequests, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('instructor_status', 'pending')
    .order('created_at', { ascending: false })

  if (fetchError) {
    console.error('Error fetching pending requests:', fetchError)
    return NextResponse.json({ error: 'Failed to fetch pending requests' }, { status: 500 })
  }

  return NextResponse.json({ requests: pendingRequests })
}
