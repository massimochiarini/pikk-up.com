import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { verifyAdmin } from '@/lib/verify-admin'

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
