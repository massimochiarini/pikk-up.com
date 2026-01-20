import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { addDays } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const {
      instructorId,
      title,
      description,
      priceCents,
      maxCapacity,
      skillLevel,
      date,
      startTime,
      durationMinutes,
      recurring,
      recurrenceWeeks,
    } = await request.json()

    // Validate required fields
    if (!instructorId || !title || !date || !startTime || !durationMinutes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Calculate end time from start time and duration
    const [startHours, startMinutes] = startTime.split(':').map(Number)
    const totalStartMinutes = startHours * 60 + startMinutes
    const totalEndMinutes = totalStartMinutes + durationMinutes
    const endHours = Math.floor(totalEndMinutes / 60)
    const endMinutes = totalEndMinutes % 60
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`
    const formattedStartTime = `${startTime}:00`

    // Determine how many classes to create
    const occurrences = recurring && recurrenceWeeks > 1 ? recurrenceWeeks : 1
    const createdClasses: any[] = []

    for (let i = 0; i < occurrences; i++) {
      // Calculate the date for this occurrence
      const occurrenceDate = new Date(date)
      if (i > 0) {
        occurrenceDate.setDate(occurrenceDate.getDate() + (i * 7))
      }
      const formattedDate = occurrenceDate.toISOString().split('T')[0]

      // Check if a time slot already exists for this date/time
      const { data: existingSlot } = await supabase
        .from('time_slots')
        .select('id, status')
        .eq('date', formattedDate)
        .eq('start_time', formattedStartTime)
        .single()

      let timeSlotId: string

      if (existingSlot) {
        // If slot exists and is already claimed, skip this occurrence
        if (existingSlot.status === 'claimed') {
          console.log(`Slot already claimed for ${formattedDate} at ${formattedStartTime}, skipping`)
          continue
        }
        timeSlotId = existingSlot.id

        // Update the existing slot to claimed
        await supabase
          .from('time_slots')
          .update({ status: 'claimed', end_time: endTime })
          .eq('id', timeSlotId)
      } else {
        // Create a new time slot
        const { data: newSlot, error: slotError } = await supabase
          .from('time_slots')
          .insert({
            date: formattedDate,
            start_time: formattedStartTime,
            end_time: endTime,
            status: 'claimed',
          })
          .select()
          .single()

        if (slotError) {
          console.error('Error creating time slot:', slotError)
          continue
        }
        timeSlotId = newSlot.id
      }

      // Create the class
      const { data: newClass, error: classError } = await supabase
        .from('classes')
        .insert({
          instructor_id: instructorId,
          time_slot_id: timeSlotId,
          title: title.trim(),
          description: description?.trim() || null,
          price_cents: priceCents || 0,
          max_capacity: maxCapacity || 15,
          skill_level: skillLevel || 'all',
          status: 'upcoming',
        })
        .select()
        .single()

      if (classError) {
        console.error('Error creating class:', classError)
        // Try to revert the time slot
        await supabase
          .from('time_slots')
          .update({ status: 'available' })
          .eq('id', timeSlotId)
        continue
      }

      createdClasses.push({
        ...newClass,
        date: formattedDate,
        start_time: formattedStartTime,
        end_time: endTime,
      })
    }

    if (createdClasses.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create any classes. The time slots may already be taken.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      classes: createdClasses,
      message: `Successfully created ${createdClasses.length} class${createdClasses.length > 1 ? 'es' : ''}`,
    })
  } catch (error) {
    console.error('Create class error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
