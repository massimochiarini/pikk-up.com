import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Lazy initialization
let stripe: Stripe | null = null

function getStripe() {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  }
  return stripe
}

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
    const { packageId, firstName, lastName, email, userId } = body

    // Validation
    if (!packageId || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Fetch package details
    const { data: packageData, error: packageError } = await supabase
      .from('instructor_packages')
      .select(`
        *,
        instructor:profiles!instructor_id(id, first_name, last_name)
      `)
      .eq('id', packageId)
      .eq('is_active', true)
      .single()

    if (packageError || !packageData) {
      return NextResponse.json(
        { error: 'Package not found or no longer available' },
        { status: 404 }
      )
    }

    const customerName = `${firstName.trim()} ${lastName.trim()}`
    const emailNormalized = email.toLowerCase().trim()
    const instructorName = `${packageData.instructor.first_name} ${packageData.instructor.last_name}`

    // Create Stripe Checkout Session
    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: emailNormalized,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${packageData.name} - ${packageData.class_count} Classes`,
              description: `Class package with ${instructorName}${packageData.description ? `\n${packageData.description}` : ''}`,
            },
            unit_amount: packageData.price_cents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        type: 'package', // Distinguishes from class bookings
        packageId: packageData.id,
        instructorId: packageData.instructor_id,
        classCount: packageData.class_count.toString(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: emailNormalized,
        customerName,
        userId: userId || '',
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/booking-success?session_id={CHECKOUT_SESSION_ID}&type=package`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/classes?package_cancelled=true`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // Expire in 30 minutes
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error: any) {
    console.error('Package purchase error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
