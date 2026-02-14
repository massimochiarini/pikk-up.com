import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/verify-admin'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Verify the user is an admin
    const { isAdmin, error: adminError } = await verifyAdmin(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: adminError || 'Admin access required' },
        { status: 403 }
      )
    }

    const {
      instructorId,
      timeSlotId,
      title,
      description,
      priceCents,
      maxCapacity,
      skillLevel,
      isDonation,
    } = await request.json()

    // Validate required fields
    if (!instructorId || !timeSlotId || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: instructorId, timeSlotId, and title are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Verify the instructor exists and is approved
    const { data: instructor, error: instructorError } = await supabase
      .from('profiles')
      .select('id, is_instructor, first_name, last_name')
      .eq('id', instructorId)
      .single()

    if (instructorError || !instructor) {
      return NextResponse.json(
        { error: 'Instructor not found' },
        { status: 404 }
      )
    }

    if (!instructor.is_instructor) {
      return NextResponse.json(
        { error: 'Selected user is not an approved instructor' },
        { status: 400 }
      )
    }

    // Verify the time slot exists and is available
    const { data: timeSlot, error: slotError } = await supabase
      .from('time_slots')
      .select('id, status, date, start_time, end_time')
      .eq('id', timeSlotId)
      .single()

    if (slotError || !timeSlot) {
      return NextResponse.json(
        { error: 'Time slot not found' },
        { status: 404 }
      )
    }

    if (timeSlot.status !== 'available') {
      return NextResponse.json(
        { error: 'Time slot is not available' },
        { status: 400 }
      )
    }

    // Determine pricing
    const finalPriceCents = priceCents || 0
    const finalIsDonation = isDonation ?? (finalPriceCents === 0)

    // Create the class using service role (bypasses RLS)
    const { data: newClass, error: createError } = await supabase
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

    if (createError) {
      console.error('Error creating class:', createError)
      return NextResponse.json(
        { error: 'Failed to create class' },
        { status: 500 }
      )
    }

    // Update the time slot status to 'claimed'
    const { error: updateSlotError } = await supabase
      .from('time_slots')
      .update({ status: 'claimed' })
      .eq('id', timeSlotId)

    if (updateSlotError) {
      console.error('Error updating time slot:', updateSlotError)
      // Class was created, but slot update failed — not fatal
    }

    return NextResponse.json({
      success: true,
      class: newClass,
      message: `Class "${title}" created for ${instructor.first_name} ${instructor.last_name}`,
    })
  } catch (error) {
    console.error('Create class error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
