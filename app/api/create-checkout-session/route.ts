import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { BOOKING_CUTOFF_DATE } from '@/lib/constants'

// Lazy initialization
let stripe: Stripe | null = null

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getStripe() {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  }
  return stripe
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      classId,
      firstName,
      lastName,
      email,
      priceCents,
      isDonation,
      sessionTitle,
      sessionDate,
      sessionTime,
      venueName,
    } = body

    // Validation
    if (!classId || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Only February classes can be booked
    const supabase = getSupabase()
    const { data: yogaClass, error: classError } = await supabase
      .from('classes')
      .select('id, time_slot_id')
      .eq('id', classId)
      .single()

    if (!classError && yogaClass) {
      const { data: timeSlot } = await supabase
        .from('time_slots')
        .select('date')
        .eq('id', yogaClass.time_slot_id)
        .single()
      if (timeSlot && timeSlot.date >= BOOKING_CUTOFF_DATE) {
        return NextResponse.json(
          { error: 'Booking is closed. Only February classes can be booked.' },
          { status: 400 }
        )
      }
    }

    // For non-donation classes, price is required and must be positive
    if (!isDonation && (!priceCents || priceCents <= 0)) {
      return NextResponse.json(
        { error: 'Invalid price' },
        { status: 400 }
      )
    }

    // For donation classes, price must be positive (0 donations are handled as free bookings)
    if (isDonation && priceCents <= 0) {
      return NextResponse.json(
        { error: 'Invalid donation amount' },
        { status: 400 }
      )
    }

    const customerName = `${firstName.trim()} ${lastName.trim()}`
    const emailNormalized = email.toLowerCase().trim()

    // Determine product name based on whether it's a donation
    const productName = isDonation 
      ? `Donation - ${sessionTitle || 'Yoga Class'}`
      : sessionTitle || 'Yoga Class'

    // Create Stripe Checkout Session
    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: emailNormalized,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description: `${sessionDate} at ${sessionTime}\n${venueName}`,
            },
            unit_amount: priceCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        classId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: emailNormalized,
        customerName,
        isDonation: isDonation ? 'true' : 'false',
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/book/${classId}?payment=cancelled`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // Expire in 30 minutes
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error: any) {
    console.error('Stripe Checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
