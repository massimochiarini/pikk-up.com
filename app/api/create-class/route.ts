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
      isDonation,
    } = await request.json()
    
    // Determine if this is a donation-based class
    // If no price or price is 0, treat as donation
    const finalPriceCents = priceCents || 0
    const finalIsDonation = isDonation ?? (finalPriceCents === 0)

    // Validate required fields
    if (!instructorId || !title || !date || !startTime || !durationMinutes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Calculate end time from start time and duration
    // Add 30-minute buffer after each class
    const BUFFER_MINUTES = 30
    const [startHours, startMinutes] = startTime.split(':').map(Number)
    const totalStartMinutes = startHours * 60 + startMinutes
    const totalEndMinutes = totalStartMinutes + durationMinutes + BUFFER_MINUTES
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

      // Check for overlapping time slots on this date
      const { data: claimedSlots } = await supabase
        .from('time_slots')
        .select('start_time, end_time')
        .eq('date', formattedDate)
        .eq('status', 'claimed')
      
      // Check if the new class would overlap with any existing claimed slots
      const newStartMinutes = totalStartMinutes
      const newEndMinutes = totalEndMinutes
      
      const hasOverlap = claimedSlots?.some(slot => {
        const [slotStartH, slotStartM] = slot.start_time.split(':').map(Number)
        const [slotEndH, slotEndM] = slot.end_time.split(':').map(Number)
        const slotStartMinutes = slotStartH * 60 + slotStartM
        const slotEndMinutes = slotEndH * 60 + slotEndM
        
        // Check if time ranges overlap
        return (newStartMinutes < slotEndMinutes && newEndMinutes > slotStartMinutes)
      })

      if (hasOverlap) {
        console.log(`Time slot overlaps with existing class for ${formattedDate} at ${formattedStartTime}, skipping`)
        continue
      }

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
          price_cents: finalPriceCents,
          max_capacity: maxCapacity || 15,
          skill_level: skillLevel || 'all',
          status: 'upcoming',
          is_donation: finalIsDonation,
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
