import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Lazy initialization
let stripe: Stripe | null = null

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
      phone,
      priceCents,
      sessionTitle,
      sessionDate,
      sessionTime,
      venueName,
    } = body

    // Validation
    if (!classId || !firstName || !lastName || !phone || !priceCents) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (priceCents <= 0) {
      return NextResponse.json(
        { error: 'Invalid price' },
        { status: 400 }
      )
    }

    const customerName = `${firstName.trim()} ${lastName.trim()}`
    const phoneNormalized = phone.replace(/\D/g, '')

    // Create Stripe Checkout Session
    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: sessionTitle || 'Yoga Class',
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
        phone: phoneNormalized,
        customerName,
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
