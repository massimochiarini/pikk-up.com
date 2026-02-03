import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

// Fail fast with clear error if Resend is not configured (set via: supabase secrets set RESEND_API_KEY=re_xxx)
if (!RESEND_API_KEY || RESEND_API_KEY.trim() === '') {
  console.error('RESEND_API_KEY is not set. Set it with: supabase secrets set RESEND_API_KEY=your_key')
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  guestName: string
  sessionTitle: string
  sessionDate: string
  sessionTime: string
  venueName: string
  venueAddress?: string
  cost: number
  bookingId: string
  paidWithCredit?: boolean
}

function generateEmailHtml(data: EmailRequest): string {
  const costDisplay = data.cost === 0 ? 'Free' : `$${(data.cost / 100).toFixed(0)}`
  const paymentMethod = data.paidWithCredit ? 'Package Credit' : costDisplay

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #f0f0f0;">
              <h1 style="margin: 0 0 10px; font-size: 28px; font-weight: 300; color: #1a1a1a; letter-spacing: -0.5px;">PikkUp</h1>
              <p style="margin: 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 2px;">Booking Confirmed</p>
            </td>
          </tr>
          
          <!-- Confirmation Badge -->
          <tr>
            <td style="padding: 30px 40px 20px; text-align: center;">
              <div style="display: inline-block; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 50px; padding: 12px 24px;">
                <span style="color: #166534; font-size: 14px; font-weight: 500;">✓ Your spot is reserved</span>
              </div>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 10px 40px 30px; text-align: center;">
              <p style="margin: 0; font-size: 18px; color: #333;">Hi ${data.guestName}!</p>
            </td>
          </tr>
          
          <!-- Class Details Card -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fafafa; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 500; color: #1a1a1a;">${data.sessionTitle}</h2>
                    
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; vertical-align: top; width: 30px;">
                          <span style="font-size: 16px;">📅</span>
                        </td>
                        <td style="padding: 8px 0; vertical-align: top;">
                          <span style="font-size: 15px; color: #333;">${data.sessionDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; vertical-align: top; width: 30px;">
                          <span style="font-size: 16px;">🕐</span>
                        </td>
                        <td style="padding: 8px 0; vertical-align: top;">
                          <span style="font-size: 15px; color: #333;">${data.sessionTime}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; vertical-align: top; width: 30px;">
                          <span style="font-size: 16px;">📍</span>
                        </td>
                        <td style="padding: 8px 0; vertical-align: top;">
                          <span style="font-size: 15px; color: #333;">${data.venueName}</span>
                          ${data.venueAddress ? `<br><span style="font-size: 14px; color: #666;">${data.venueAddress}</span>` : ''}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; vertical-align: top; width: 30px;">
                          <span style="font-size: 16px;">💰</span>
                        </td>
                        <td style="padding: 8px 0; vertical-align: top;">
                          <span style="font-size: 15px; color: #333;">${paymentMethod}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- What to Bring -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <h3 style="margin: 0 0 15px; font-size: 16px; font-weight: 500; color: #1a1a1a;">What to bring</h3>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #555;">• Yoga mat</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #555;">• Water bottle</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #555;">• Comfortable clothing</td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Arrival Note -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>Please arrive 10-15 minutes early</strong> to get settled before class begins.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Booking ID -->
          <tr>
            <td style="padding: 0 40px 40px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #999;">
                Booking ID: ${data.bookingId.substring(0, 8).toUpperCase()}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #fafafa; border-top: 1px solid #f0f0f0; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666;">See you there! 🧘</p>
              <p style="margin: 0; font-size: 12px; color: #999;">
                Questions? Reply to this email and we'll help you out.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
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
    const data: EmailRequest = await req.json()

    // Validate required fields
    if (
      !data.to ||
      !data.guestName ||
      !data.sessionTitle ||
      !data.sessionDate ||
      !data.sessionTime ||
      !data.venueName ||
      !data.bookingId
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.to)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid email address',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!RESEND_API_KEY || RESEND_API_KEY.trim() === '') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email service not configured. Set RESEND_API_KEY in Supabase secrets.',
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Sending email to:', data.to)

    // Generate HTML email
    const htmlContent = generateEmailHtml(data)

    // Send via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Pick Up Yoga <bookings@pikk-up.com>',
        to: [data.to],
        subject: `Booking Confirmed: ${data.sessionTitle} on ${data.sessionDate}`,
        html: htmlContent,
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Resend error:', resendData)
      return new Response(
        JSON.stringify({
          success: false,
          error: resendData.message || 'Failed to send email',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Email sent successfully:', resendData.id)

    return new Response(
      JSON.stringify({
        success: true,
        emailId: resendData.id,
        to: data.to,
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
