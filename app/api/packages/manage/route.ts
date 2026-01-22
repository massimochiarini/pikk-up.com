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

// Get all packages for an instructor (including inactive)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')

    if (!instructorId) {
      return NextResponse.json(
        { error: 'Instructor ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Get all packages for this instructor
    const { data: packages, error } = await supabase
      .from('instructor_packages')
      .select('*')
      .eq('instructor_id', instructorId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching packages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch packages' },
        { status: 500 }
      )
    }

    // Get purchase counts for each package
    const packagesWithStats = await Promise.all(
      (packages || []).map(async (pkg) => {
        const { count: totalPurchases } = await supabase
          .from('package_credits')
          .select('*', { count: 'exact', head: true })
          .eq('package_id', pkg.id)

        const { data: creditsData } = await supabase
          .from('package_credits')
          .select('classes_remaining, classes_total')
          .eq('package_id', pkg.id)

        const totalCreditsUsed = creditsData?.reduce(
          (acc, c) => acc + (c.classes_total - c.classes_remaining),
          0
        ) || 0

        const totalCreditsRemaining = creditsData?.reduce(
          (acc, c) => acc + c.classes_remaining,
          0
        ) || 0

        return {
          ...pkg,
          total_purchases: totalPurchases || 0,
          total_credits_used: totalCreditsUsed,
          total_credits_remaining: totalCreditsRemaining,
        }
      })
    )

    return NextResponse.json({ packages: packagesWithStats })
  } catch (error: any) {
    console.error('Package management error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch packages' },
      { status: 500 }
    )
  }
}

// Update a package (toggle active, update details)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { packageId, instructorId, updates } = body

    if (!packageId || !instructorId) {
      return NextResponse.json(
        { error: 'Package ID and Instructor ID are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Verify ownership
    const { data: existingPackage, error: verifyError } = await supabase
      .from('instructor_packages')
      .select('id')
      .eq('id', packageId)
      .eq('instructor_id', instructorId)
      .single()

    if (verifyError || !existingPackage) {
      return NextResponse.json(
        { error: 'Package not found or access denied' },
        { status: 404 }
      )
    }

    // Only allow updating certain fields
    const allowedUpdates: Record<string, any> = {}
    if (updates.is_active !== undefined) allowedUpdates.is_active = updates.is_active
    if (updates.name) allowedUpdates.name = updates.name.trim()
    if (updates.description !== undefined) allowedUpdates.description = updates.description?.trim() || null

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      )
    }

    const { data: updatedPackage, error: updateError } = await supabase
      .from('instructor_packages')
      .update(allowedUpdates)
      .eq('id', packageId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating package:', updateError)
      return NextResponse.json(
        { error: 'Failed to update package' },
        { status: 500 }
      )
    }

    return NextResponse.json({ package: updatedPackage })
  } catch (error: any) {
    console.error('Package update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update package' },
      { status: 500 }
    )
  }
}

// Delete a package (only if no purchases)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const packageId = searchParams.get('packageId')
    const instructorId = searchParams.get('instructorId')

    if (!packageId || !instructorId) {
      return NextResponse.json(
        { error: 'Package ID and Instructor ID are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Check for existing purchases
    const { count: purchaseCount } = await supabase
      .from('package_credits')
      .select('*', { count: 'exact', head: true })
      .eq('package_id', packageId)

    if (purchaseCount && purchaseCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete package with existing purchases. Deactivate it instead.' },
        { status: 400 }
      )
    }

    // Delete the package
    const { error: deleteError } = await supabase
      .from('instructor_packages')
      .delete()
      .eq('id', packageId)
      .eq('instructor_id', instructorId)

    if (deleteError) {
      console.error('Error deleting package:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete package' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Package delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete package' },
      { status: 500 }
    )
  }
}
