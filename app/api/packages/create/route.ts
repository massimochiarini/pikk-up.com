import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with service role for admin operations
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { instructorId, name, description, classCount, priceCents } = body

    // Validation
    if (!instructorId || !name || !classCount || priceCents === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: instructorId, name, classCount, priceCents' },
        { status: 400 }
      )
    }

    if (classCount < 1) {
      return NextResponse.json(
        { error: 'Class count must be at least 1' },
        { status: 400 }
      )
    }

    if (priceCents < 0) {
      return NextResponse.json(
        { error: 'Price cannot be negative' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Verify the instructor exists and is an instructor
    const { data: instructor, error: instructorError } = await supabase
      .from('profiles')
      .select('id, is_instructor')
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
        { error: 'User is not an instructor' },
        { status: 403 }
      )
    }

    // Create the package
    const { data: packageData, error: packageError } = await supabase
      .from('instructor_packages')
      .insert({
        instructor_id: instructorId,
        name: name.trim(),
        description: description?.trim() || null,
        class_count: classCount,
        price_cents: priceCents,
        is_active: true,
      })
      .select()
      .single()

    if (packageError) {
      console.error('Error creating package:', packageError)
      return NextResponse.json(
        { error: 'Failed to create package' },
        { status: 500 }
      )
    }

    return NextResponse.json({ package: packageData })
  } catch (error: any) {
    console.error('Package creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create package' },
      { status: 500 }
    )
  }
}
