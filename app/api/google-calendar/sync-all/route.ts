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

    // Get all upcoming classes that don't have a calendar event ID
    const today = new Date().toISOString().split('T')[0]
    
    const { data: classes, error: classesError } = await serverClient
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
      .is('google_calendar_event_id', null)
      .eq('status', 'upcoming')

    if (classesError) {
      console.error('Error fetching classes:', classesError)
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
    }

    // Filter to only future classes
    const upcomingClasses = (classes || []).filter((cls: any) => {
      const timeSlot = Array.isArray(cls.time_slot) ? cls.time_slot[0] : cls.time_slot
      return timeSlot && timeSlot.date >= today
    })

    let synced = 0
    let failed = 0

    // Sync each class to Google Calendar
    for (const cls of upcomingClasses) {
      try {
        const timeSlot = Array.isArray(cls.time_slot) ? cls.time_slot[0] : cls.time_slot
        const instructor = Array.isArray(cls.instructor) ? cls.instructor[0] : cls.instructor
        
        if (!timeSlot) continue

        // Calculate class end time (remove the 30-min buffer that's stored)
        // The stored end_time includes buffer, so we need to use actual class duration
        // For simplicity, we'll use the stored end_time minus 30 minutes
        const [endH, endM] = timeSlot.end_time.split(':').map(Number)
        const endMinutes = endH * 60 + endM - 30 // Remove 30-min buffer
        const classEndHours = Math.floor(endMinutes / 60)
        const classEndMins = endMinutes % 60
        const classEndTime = `${String(classEndHours).padStart(2, '0')}:${String(classEndMins).padStart(2, '0')}:00`

        const instructorName = instructor 
          ? `${instructor.first_name} ${instructor.last_name}` 
          : undefined

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
          // Store the calendar event ID
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

    return NextResponse.json({
      success: true,
      synced,
      failed,
      total: upcomingClasses.length,
      message: `Synced ${synced} classes to Google Calendar${failed > 0 ? `, ${failed} failed` : ''}`
    })
  } catch (error) {
    console.error('Sync all classes error:', error)
    return NextResponse.json(
      { error: 'Failed to sync classes' },
      { status: 500 }
    )
  }
}
