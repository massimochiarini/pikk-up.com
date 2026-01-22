import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instructorId: string }> }
) {
  try {
    const { instructorId } = await params

    if (!instructorId) {
      return NextResponse.json(
        { error: 'Instructor ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Get active packages for this instructor
    const { data: packages, error } = await supabase
      .from('instructor_packages')
      .select('*')
      .eq('instructor_id', instructorId)
      .eq('is_active', true)
      .order('class_count', { ascending: true })

    if (error) {
      console.error('Error fetching packages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch packages' },
        { status: 500 }
      )
    }

    return NextResponse.json({ packages: packages || [] })
  } catch (error: any) {
    console.error('Package fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch packages' },
      { status: 500 }
    )
  }
}
