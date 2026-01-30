import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const WAIVER_PDF_URL = Deno.env.get('WAIVER_PDF_URL') // URL to the waiver PDF in Supabase Storage or public folder

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface WaiverEmailRequest {
  to: string
  recipientName: string
  waiverPdfUrl?: string // Optional override for waiver PDF URL
  waiverPdfBase64?: string // Optional: send PDF as base64 instead of URL
}

function generateEmailHtml(recipientName: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Liability Waiver</title>
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
              <p style="margin: 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 2px;">Liability Waiver</p>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 40px 20px;">
              <p style="margin: 0; font-size: 18px; color: #333;">Hi ${recipientName},</p>
            </td>
          </tr>
          
          <!-- Message -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 15px; color: #555; line-height: 1.6;">
                Thank you for joining us at PikkUp! Before attending your first class, please review and sign the attached liability waiver.
              </p>
              <p style="margin: 0 0 20px; font-size: 15px; color: #555; line-height: 1.6;">
                This waiver is a standard document that helps protect both you and our instructors during yoga practice. It covers important information about:
              </p>
              <ul style="margin: 0 0 20px; padding-left: 20px; font-size: 15px; color: #555; line-height: 1.8;">
                <li>Assumption of risk during physical activity</li>
                <li>Health and medical considerations</li>
                <li>Emergency contact information</li>
                <li>Photo/video consent</li>
              </ul>
            </td>
          </tr>
          
          <!-- Instructions -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background-color: #fafafa; border-radius: 8px; padding: 24px;">
                <h3 style="margin: 0 0 15px; font-size: 16px; font-weight: 500; color: #1a1a1a;">How to complete:</h3>
                <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #555; line-height: 1.8;">
                  <li>Download and review the attached PDF waiver</li>
                  <li>Print, sign, and date the document</li>
                  <li>Bring the signed waiver to your first class, or</li>
                  <li>Reply to this email with a photo/scan of the signed waiver</li>
                </ol>
              </div>
            </td>
          </tr>
          
          <!-- Note -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>Note:</strong> You only need to complete this waiver once. It will be kept on file for all future classes.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #fafafa; border-top: 1px solid #f0f0f0; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666;">We look forward to practicing with you!</p>
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
    const data: WaiverEmailRequest = await req.json()

    // Validate required fields
    if (!data.to || !data.recipientName) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: to, recipientName',
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

    console.log('Sending waiver email to:', data.to)

    // Generate HTML email
    const htmlContent = generateEmailHtml(data.recipientName)

    // Prepare email payload
    const emailPayload: any = {
      from: 'Pick Up Yoga <waivers@pikk-up.com>',
      to: [data.to],
      subject: 'PikkUp Liability Waiver - Please Sign Before Your First Class',
      html: htmlContent,
    }

    // Add PDF attachment if provided
    if (data.waiverPdfBase64) {
      // If base64 PDF is provided directly
      emailPayload.attachments = [
        {
          filename: 'PikkUp_Liability_Waiver.pdf',
          content: data.waiverPdfBase64,
        },
      ]
    } else {
      // Fetch PDF from URL and attach
      const pdfUrl = data.waiverPdfUrl || WAIVER_PDF_URL
      
      if (pdfUrl) {
        try {
          console.log('Fetching PDF from:', pdfUrl)
          const pdfResponse = await fetch(pdfUrl)
          
          if (pdfResponse.ok) {
            const pdfBuffer = await pdfResponse.arrayBuffer()
            const pdfBase64 = btoa(
              String.fromCharCode(...new Uint8Array(pdfBuffer))
            )
            
            emailPayload.attachments = [
              {
                filename: 'PikkUp_Liability_Waiver.pdf',
                content: pdfBase64,
              },
            ]
          } else {
            console.error('Failed to fetch PDF:', pdfResponse.status)
          }
        } catch (pdfError) {
          console.error('Error fetching PDF:', pdfError)
          // Continue without attachment - email will still be sent
        }
      }
    }

    // Send via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
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

    console.log('Waiver email sent successfully:', resendData.id)

    return new Response(
      JSON.stringify({
        success: true,
        emailId: resendData.id,
        to: data.to,
        hasAttachment: !!emailPayload.attachments,
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
