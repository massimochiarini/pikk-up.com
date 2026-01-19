import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, userPhone } = await request.json()

    if (!userId && !userPhone) {
      return NextResponse.json({ error: 'User ID or phone is required' }, { status: 400 })
    }

    const supabase = createServerClient()

    const selectQuery = `
      id,
      class_id,
      status,
      created_at,
      guest_first_name,
      guest_last_name,
      guest_phone,
      user_id,
      class:classes(
        id,
        title,
        description,
        price_cents,
        skill_level,
        max_capacity,
        time_slot:time_slots(date, start_time, end_time),
        instructor:profiles!instructor_id(first_name, last_name, instagram, bio)
      )
    `

    // Build the query to find bookings by user_id OR phone
    let query = supabase
      .from('bookings')
      .select(selectQuery)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })

    // Normalize phone if provided
    const phoneNormalized = userPhone?.replace(/\D/g, '') || ''

    // We need to use OR logic - fetch both and dedupe
    const bookings: any[] = []
    const seenIds = new Set<string>()

    // Fetch by user_id
    if (userId) {
      const { data: userBookings, error: userError } = await supabase
        .from('bookings')
        .select(selectQuery)
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })

      if (!userError && userBookings) {
        for (const b of userBookings) {
          if (!seenIds.has(b.id)) {
            seenIds.add(b.id)
            bookings.push(b)
          }
        }
      }
    }

    // Fetch by phone
    if (phoneNormalized) {
      const { data: phoneBookings, error: phoneError } = await supabase
        .from('bookings')
        .select(selectQuery)
        .eq('guest_phone', phoneNormalized)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })

      if (!phoneError && phoneBookings) {
        for (const b of phoneBookings) {
          if (!seenIds.has(b.id)) {
            seenIds.add(b.id)
            bookings.push(b)
          }
        }
      }
    }

    // Filter out any bookings where class data is missing
    const validBookings = bookings.filter((b: any) => 
      b.class !== null && b.class.time_slot !== null
    )

    // Get unique class IDs using Array.from to avoid TypeScript downlevelIteration issue
    const classIdSet = new Set(validBookings.map((b: any) => b.class_id))
    const classIds = Array.from(classIdSet)
    
    // Fetch participants for each class
    const classParticipants: Record<string, { first_name: string; last_name: string }[]> = {}

    for (const classId of classIds) {
      const { data: participants } = await supabase
        .from('bookings')
        .select('guest_first_name, guest_last_name')
        .eq('class_id', classId)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: true })
      
      if (participants) {
        classParticipants[classId] = participants.map((p: any) => ({
          first_name: p.guest_first_name || '',
          last_name: p.guest_last_name || '',
        }))
      } else {
        classParticipants[classId] = []
      }
    }

    // Add participants to each booking's class data
    const bookingsWithParticipants = validBookings.map((b: any) => ({
      ...b,
      class: {
        ...b.class,
        participants: classParticipants[b.class_id] || [],
        booking_count: classParticipants[b.class_id]?.length || 0,
      },
    }))

    return NextResponse.json({ bookings: bookingsWithParticipants })
  } catch (error) {
    console.error('Fetch bookings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
