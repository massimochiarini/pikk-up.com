import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
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
      instructorName,
      cost,
      bookingId 
    } = await req.json()

    // Validate required fields
    if (!to || !guestName || !sessionTitle || !sessionDate || !sessionTime) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Format the email content
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Class Confirmation - Pick Up</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #8DD8F8 0%, #A0ED8D 100%); padding: 40px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
              <h1 style="margin: 0; color: #000000; font-size: 32px; font-weight: 800;">You're All Set!</h1>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 0 0 24px 0;">
                Hi ${guestName},
              </p>
              
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 0 0 32px 0;">
                Your spot has been confirmed! We're excited to see you at the session.
              </p>

              <!-- Session Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; border: 2px solid #e5e7eb; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #111827; font-weight: 700;">${sessionTitle}</h2>
                    
                    <!-- Date & Time -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                      <tr>
                        <td width="30" valign="top">
                          <div style="font-size: 20px;">📅</div>
                        </td>
                        <td>
                          <div style="font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">DATE & TIME</div>
                          <div style="font-size: 16px; color: #111827; font-weight: 600;">${sessionDate}</div>
                          <div style="font-size: 14px; color: #6b7280;">${sessionTime}</div>
                        </td>
                      </tr>
                    </table>

                    <!-- Location -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                      <tr>
                        <td width="30" valign="top">
                          <div style="font-size: 20px;">📍</div>
                        </td>
                        <td>
                          <div style="font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">LOCATION</div>
                          <div style="font-size: 16px; color: #111827; font-weight: 600;">${venueName}</div>
                          ${venueAddress ? `<div style="font-size: 14px; color: #6b7280;">${venueAddress}</div>` : ''}
                        </td>
                      </tr>
                    </table>

                    <!-- Instructor -->
                    ${instructorName ? `
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                      <tr>
                        <td width="30" valign="top">
                          <div style="font-size: 20px;">👤</div>
                        </td>
                        <td>
                          <div style="font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">INSTRUCTOR</div>
                          <div style="font-size: 16px; color: #111827; font-weight: 600;">${instructorName}</div>
                        </td>
                      </tr>
                    </table>
                    ` : ''}

                    <!-- Cost -->
                    ${cost !== undefined ? `
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="30" valign="top">
                          <div style="font-size: 20px;">💰</div>
                        </td>
                        <td>
                          <div style="font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">COST</div>
                          <div style="font-size: 16px; color: #16a34a; font-weight: 700;">${cost === 0 ? 'Free' : `$${(cost / 100).toFixed(0)}`}</div>
                        </td>
                      </tr>
                    </table>
                    ` : ''}
                  </td>
                </tr>
              </table>

              <!-- What to Bring -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #92400e; font-weight: 700;">📋 What to Bring</h3>
                <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px; line-height: 1.6;">
                  <li>Yoga mat (or one will be provided)</li>
                  <li>Water bottle</li>
                  <li>Comfortable clothing</li>
                  <li>Please arrive 5-10 minutes early</li>
                </ul>
              </div>

              <!-- Important Notes -->
              <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 8px; margin-bottom: 32px;">
                <p style="margin: 0; font-size: 14px; color: #166534; line-height: 1.6;">
                  <strong>✓ Confirmation:</strong> Your booking ID is <strong>#${bookingId.substring(0, 8)}</strong>
                </p>
              </div>

              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 0 0 8px 0;">
                See you there!
              </p>
              
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 0;">
                <strong>The Pick Up Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
                Questions? Contact your instructor through the Pick Up app.
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                This is an automated confirmation email for your booking.
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

    const emailText = `
You're All Set!

Hi ${guestName},

Your spot has been confirmed for:

${sessionTitle}

Date & Time: ${sessionDate} at ${sessionTime}
Location: ${venueName}${venueAddress ? '\n' + venueAddress : ''}
${instructorName ? 'Instructor: ' + instructorName : ''}
${cost !== undefined ? 'Cost: ' + (cost === 0 ? 'Free' : `$${(cost / 100).toFixed(0)}`) : ''}

What to Bring:
- Yoga mat (or one will be provided)
- Water bottle
- Comfortable clothing
- Please arrive 5-10 minutes early

Your booking ID: #${bookingId.substring(0, 8)}

See you there!
The Pick Up Team

Questions? Contact your instructor through the Pick Up app.
    `

    // Send email using Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Pick Up <bookings@pickupapp.io>',
        to: [to],
        subject: `✓ Confirmed: ${sessionTitle} - ${sessionDate}`,
        html: emailHtml,
        text: emailText,
      })
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || 'Failed to send email')
    }

    return new Response(
      JSON.stringify({ success: true, messageId: data.id }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    )
  }
})
