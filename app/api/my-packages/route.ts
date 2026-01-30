import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const email = searchParams.get('email')

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Either userId or email is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Build the query
    let query = supabase
      .from('package_credits')
      .select(`
        *,
        package:instructor_packages(*),
        instructor:profiles!instructor_id(id, first_name, last_name, avatar_url)
      `)
      .gt('classes_remaining', 0)
      .order('purchased_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    } else if (email) {
      query = query.eq('guest_email', email.toLowerCase().trim())
    }

    const { data: credits, error } = await query

    if (error) {
      console.error('Error fetching package credits:', error)
      return NextResponse.json(
        { error: 'Failed to fetch packages' },
        { status: 500 }
      )
    }

    return NextResponse.json({ credits: credits || [] })
  } catch (error: any) {
    console.error('My packages error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch packages' },
      { status: 500 }
    )
  }
}

// Get credits for a specific instructor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { instructorId, userId, email } = body

    if (!instructorId) {
      return NextResponse.json(
        { error: 'Instructor ID is required' },
        { status: 400 }
      )
    }

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Either userId or email is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Get total available credits with this instructor
    const { data: credits, error } = await supabase
      .rpc('get_available_credits', {
        p_instructor_id: instructorId,
        p_user_id: userId || null,
        p_email: email ? email.toLowerCase().trim() : null,
      })

    if (error) {
      console.error('Error getting credits:', error)
      return NextResponse.json(
        { error: 'Failed to get credits' },
        { status: 500 }
      )
    }

    return NextResponse.json({ credits: credits || 0 })
  } catch (error: any) {
    console.error('Get credits error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get credits' },
      { status: 500 }
    )
  }
}
