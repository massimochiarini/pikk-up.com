import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: corsHeaders,
    })
  }

  try {
    const {
      to,
      guestName,
      sessionTitle,
      sessionDate,
      sessionTime,
      venueName,
      venueAddress,
      cost,
      bookingId,
    } = await req.json()

    // Validate required fields
    if (
      !to ||
      !guestName ||
      !sessionTitle ||
      !sessionDate ||
      !sessionTime ||
      !venueName
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Format phone to E.164
    let formattedPhone = to.trim().replace(/\D/g, '')

    if (formattedPhone.length === 10) {
      formattedPhone = '+1' + formattedPhone
    } else if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
      formattedPhone = '+' + formattedPhone
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone
    }

    console.log('Sending SMS to:', formattedPhone)

    // Format cost
    const costDisplay = cost === 0 ? 'Free' : `$${(cost / 100).toFixed(0)}`

    // Construct message
    const message = `✅ Yoga Class Confirmed!

${sessionTitle}
📅 ${sessionDate}
🕐 ${sessionTime}
📍 ${venueName}
${venueAddress ? `   ${venueAddress}` : ''}
💰 ${costDisplay}

Hi ${guestName}! Your spot is reserved. Please arrive 10-15 min early.

What to bring:
• Yoga mat
• Water bottle
• Comfortable clothing

Booking ID: ${bookingId.substring(0, 8)}

See you there! 🧘‍♀️`

    // Send via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`

    const formData = new URLSearchParams()
    formData.append('To', formattedPhone)
    formData.append('From', TWILIO_PHONE_NUMBER!)
    formData.append('Body', message)

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        Authorization:
          'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const twilioData = await twilioResponse.json()

    if (!twilioResponse.ok) {
      console.error('Twilio error:', twilioData)
      return new Response(
        JSON.stringify({
          success: false,
          error: twilioData.message || 'Failed to send SMS',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('SMS sent successfully:', twilioData.sid)

    return new Response(
      JSON.stringify({
        success: true,
        messageSid: twilioData.sid,
        to: twilioData.to,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
