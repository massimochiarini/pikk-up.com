import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get calendar status from database
    const serverClient = createServerClient()
    const { data: profile } = await serverClient
      .from('profiles')
      .select('google_calendar_connected, google_calendar_id')
      .eq('id', user.id)
      .single()

    // Check if Google Calendar API is configured
    const isConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

    return NextResponse.json({
      configured: isConfigured,
      connected: profile?.google_calendar_connected || false,
      calendarId: profile?.google_calendar_id || 'primary',
    })
  } catch (error) {
    console.error('Google Calendar status error:', error)
    return NextResponse.json(
      { error: 'Failed to get calendar status' },
      { status: 500 }
    )
  }
}
