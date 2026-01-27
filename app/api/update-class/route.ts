import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function PUT(request: NextRequest) {
  try {
    const {
      classId,
      instructorId,
      title,
      description,
      priceCents,
      maxCapacity,
      skillLevel,
      isDonation,
    } = await request.json()

    // Validate required fields
    if (!classId || !instructorId || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Verify ownership of the class
    const { data: existingClass, error: fetchError } = await supabase
      .from('classes')
      .select('id, instructor_id')
      .eq('id', classId)
      .single()

    if (fetchError || !existingClass) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    if (existingClass.instructor_id !== instructorId) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this class' },
        { status: 403 }
      )
    }

    // Determine if this is a donation-based class
    const finalPriceCents = priceCents || 0
    const finalIsDonation = isDonation ?? (finalPriceCents === 0)

    // Update the class
    const { data: updatedClass, error: updateError } = await supabase
      .from('classes')
      .update({
        title: title.trim(),
        description: description?.trim() || null,
        price_cents: finalPriceCents,
        max_capacity: maxCapacity || 15,
        skill_level: skillLevel || 'all',
        is_donation: finalIsDonation,
      })
      .eq('id', classId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating class:', updateError)
      return NextResponse.json(
        { error: 'Failed to update class' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      class: updatedClass,
      message: 'Class updated successfully',
    })
  } catch (error) {
    console.error('Update class error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
