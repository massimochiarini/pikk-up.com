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

    // Calculate date threshold - go back a week to be very safe with timezones
    const threshold = new Date()
    threshold.setDate(threshold.getDate() - 7)
    const thresholdDate = threshold.toISOString().split('T')[0]
    
    console.log('Force resync:', forceResync)
    console.log('Date threshold:', thresholdDate)
    
    // Get classes - for force resync, get ALL classes regardless of status or event ID
    let query = serverClient
      .from('classes')
      .select(`
        id,
        title,
        description,
        status,
        google_calendar_event_id,
        instructor_id,
        time_slot:time_slots(date, start_time, end_time),
        instructor:profiles!classes_instructor_id_fkey(first_name, last_name)
      `)
    
    // Only filter by status and event ID if NOT forcing resync
    if (!forceResync) {
      query = query.eq('status', 'upcoming').is('google_calendar_event_id', null)
    }
    
    const { data: classes, error: classesError } = await query

    if (classesError) {
      console.error('Error fetching classes:', classesError)
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
    }

    console.log('Total classes from query:', classes?.length || 0)
    
    // Log first few classes for debugging
    if (classes && classes.length > 0) {
      console.log('Sample classes:', classes.slice(0, 3).map((c: any) => ({
        id: c.id,
        title: c.title,
        status: c.status,
        hasEventId: !!c.google_calendar_event_id,
        timeSlot: c.time_slot
      })))
    }
    
    // Filter to classes with valid time slots and future dates
    const upcomingClasses = (classes || []).filter((cls: any) => {
      const timeSlot = Array.isArray(cls.time_slot) ? cls.time_slot[0] : cls.time_slot
      if (!timeSlot) {
        console.log('Class has no time slot:', cls.id, cls.title)
        return false
      }
      const isUpcoming = timeSlot.date >= thresholdDate
      if (!isUpcoming) {
        console.log('Class filtered out by date:', cls.id, cls.title, timeSlot.date)
      }
      return isUpcoming
    })
    
    console.log('Classes after date filter:', upcomingClasses.length)

    let synced = 0
    let skipped = 0
    let failed = 0

    // Sync each class to Google Calendar
    for (const cls of upcomingClasses) {
      try {
        const timeSlot = Array.isArray(cls.time_slot) ? cls.time_slot[0] : cls.time_slot
        const instructor = Array.isArray(cls.instructor) ? cls.instructor[0] : cls.instructor
        
        if (!timeSlot) {
          console.log('Skipping class without time slot:', cls.id)
          continue
        }

        // Skip if already has an event ID and not forcing resync
        if (cls.google_calendar_event_id && !forceResync) {
          console.log('Skipping already synced class:', cls.id, cls.title)
          skipped++
          continue
        }
        
        console.log('Syncing class:', cls.id, cls.title, 'Date:', timeSlot.date)

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
