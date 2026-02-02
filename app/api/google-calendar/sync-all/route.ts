import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase'
import { createCalendarEvent } from '@/lib/google-calendar'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated and is admin
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

    // Check if force resync is requested - check both body and URL param
    let forceResync = false
    
    // Check URL param first
    const url = new URL(request.url)
    if (url.searchParams.get('force') === 'true') {
      forceResync = true
    }
    
    // Also check body
    if (!forceResync) {
      try {
        const body = await request.json()
        forceResync = body.force === true
      } catch {
        // No body or invalid JSON, that's fine
      }
    }
    
    console.log('Sync all classes - forceResync:', forceResync)

    // Verify admin status
    const serverClient = createServerClient()
    const { data: profile } = await serverClient
      .from('profiles')
      .select('is_admin, google_calendar_connected')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (!profile?.google_calendar_connected) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 })
    }

    // Get all upcoming classes
    // Use yesterday's date to account for timezone differences (EST vs UTC)
    const now = new Date()
    now.setDate(now.getDate() - 1) // Go back 1 day to be safe
    const yesterday = now.toISOString().split('T')[0]
    
    // If force resync, get ALL upcoming classes; otherwise only those without event IDs
    let query = serverClient
      .from('classes')
      .select(`
        id,
        title,
        description,
        google_calendar_event_id,
        instructor_id,
        time_slot:time_slots(date, start_time, end_time),
        instructor:profiles!classes_instructor_id_fkey(first_name, last_name)
      `)
      .eq('status', 'upcoming')
    
    if (!forceResync) {
      query = query.is('google_calendar_event_id', null)
    }
    
    const { data: classes, error: classesError } = await query

    if (classesError) {
      console.error('Error fetching classes:', classesError)
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
    }

    console.log('Total classes from query:', classes?.length || 0)
    
    // Filter to only future/current classes (using yesterday to account for timezone)
    const upcomingClasses = (classes || []).filter((cls: any) => {
      const timeSlot = Array.isArray(cls.time_slot) ? cls.time_slot[0] : cls.time_slot
      return timeSlot && timeSlot.date >= yesterday
    })
    
    console.log('Upcoming classes after date filter:', upcomingClasses.length)
    console.log('Date threshold (yesterday):', yesterday)

    let synced = 0
    let skipped = 0
    let failed = 0

    // Sync each class to Google Calendar
    for (const cls of upcomingClasses) {
      try {
        const timeSlot = Array.isArray(cls.time_slot) ? cls.time_slot[0] : cls.time_slot
        const instructor = Array.isArray(cls.instructor) ? cls.instructor[0] : cls.instructor
        
        if (!timeSlot) continue

        // Skip if already has an event ID and not forcing resync
        if (cls.google_calendar_event_id && !forceResync) {
          skipped++
          continue
        }

        // Calculate class end time (remove the 30-min buffer that's stored)
        const [endH, endM] = timeSlot.end_time.split(':').map(Number)
        const endMinutes = endH * 60 + endM - 30 // Remove 30-min buffer
        const classEndHours = Math.floor(endMinutes / 60)
        const classEndMins = endMinutes % 60
        const classEndTime = `${String(classEndHours).padStart(2, '0')}:${String(classEndMins).padStart(2, '0')}:00`

        const instructorName = instructor 
          ? `${instructor.first_name} ${instructor.last_name}` 
          : undefined

        // Create new calendar event (this will create a new event even if old ID exists)
        const eventId = await createCalendarEvent({
          id: cls.id,
          title: cls.title,
          description: cls.description || undefined,
          date: timeSlot.date,
          startTime: timeSlot.start_time,
          endTime: classEndTime,
          instructorName,
        })

        if (eventId) {
          // Store the new calendar event ID
          await serverClient
            .from('classes')
            .update({ google_calendar_event_id: eventId })
            .eq('id', cls.id)
          
          synced++
        } else {
          failed++
        }
      } catch (err) {
        console.error('Error syncing class:', cls.id, err)
        failed++
      }
    }

    const message = forceResync 
      ? `Re-synced ${synced} classes to Google Calendar${failed > 0 ? `, ${failed} failed` : ''}`
      : `Synced ${synced} new classes to Google Calendar${skipped > 0 ? ` (${skipped} already synced)` : ''}${failed > 0 ? `, ${failed} failed` : ''}`

    return NextResponse.json({
      success: true,
      synced,
      skipped,
      failed,
      total: upcomingClasses.length,
      message
    })
  } catch (error) {
    console.error('Sync all classes error:', error)
    return NextResponse.json(
      { error: 'Failed to sync classes' },
      { status: 500 }
    )
  }
}
