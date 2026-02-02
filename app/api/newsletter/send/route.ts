import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const RESEND_API_KEY = process.env.RESEND_API_KEY

interface DealInfo {
  title: string
  description: string
  code?: string
}

interface ClassInfo {
  id: string
  title: string
  description: string
  date: string
  time: string
  instructor_name: string
  price_display: string
  spots_left: number
}

interface TeacherInfo {
  id: string
  name: string
  bio: string
  avatar_url: string | null
}

function generateNewsletterHtml(
  subscriberName: string | null,
  classes: ClassInfo[],
  teachers: TeacherInfo[],
  deals: DealInfo[],
  introMessage: string,
  unsubscribeUrl: string
): string {
  const greeting = subscriberName ? `Hi ${subscriberName}!` : 'Hey there!'
  
  const classesHtml = classes.length > 0 ? `
    <tr>
      <td style="padding: 0 40px 30px;">
        <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 500; color: #1a1a1a;">This Week's Classes</h2>
        ${classes.map(c => `
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fafafa; border-radius: 8px; margin-bottom: 16px;">
            <tr>
              <td style="padding: 20px;">
                <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 500; color: #1a1a1a;">${c.title}</h3>
                <p style="margin: 0 0 12px; font-size: 14px; color: #666;">with ${c.instructor_name}</p>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 4px 0; font-size: 14px; color: #333;">
                      <span style="margin-right: 8px;">📅</span>${c.date} at ${c.time}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-size: 14px; color: #333;">
                      <span style="margin-right: 8px;">💰</span>${c.price_display}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-size: 14px; color: ${c.spots_left <= 3 ? '#dc2626' : '#333'};">
                      <span style="margin-right: 8px;">👥</span>${c.spots_left <= 3 ? `Only ${c.spots_left} spots left!` : `${c.spots_left} spots available`}
                    </td>
                  </tr>
                </table>
                <a href="https://pikk-up.com/book/${c.id}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">Book Now</a>
              </td>
            </tr>
          </table>
        `).join('')}
      </td>
    </tr>
  ` : ''

  const teachersHtml = teachers.length > 0 ? `
    <tr>
      <td style="padding: 0 40px 30px;">
        <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 500; color: #1a1a1a;">Featured Teachers</h2>
        ${teachers.map(t => `
          <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <tr>
              <td style="width: 60px; vertical-align: top;">
                ${t.avatar_url 
                  ? `<img src="${t.avatar_url}" alt="${t.name}" style="width: 50px; height: 50px; border-radius: 25px; object-fit: cover;">`
                  : `<div style="width: 50px; height: 50px; border-radius: 25px; background-color: #e5e5e5; text-align: center; line-height: 50px; font-size: 20px; color: #666;">🧘</div>`
                }
              </td>
              <td style="vertical-align: top; padding-left: 12px;">
                <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 500; color: #1a1a1a;">${t.name}</h3>
                <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">${t.bio ? t.bio.substring(0, 150) + (t.bio.length > 150 ? '...' : '') : 'Experienced yoga instructor'}</p>
              </td>
            </tr>
          </table>
        `).join('')}
      </td>
    </tr>
  ` : ''

  const dealsHtml = deals.length > 0 ? `
    <tr>
      <td style="padding: 0 40px 30px;">
        <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 500; color: #1a1a1a;">Special Deals</h2>
        ${deals.map(d => `
          <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; margin-bottom: 16px;">
            <tr>
              <td style="padding: 20px;">
                <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #92400e;">🎉 ${d.title}</h3>
                <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.5;">${d.description}</p>
                ${d.code ? `<p style="margin: 12px 0 0; font-size: 14px; color: #92400e;"><strong>Use code:</strong> <span style="background-color: #ffffff; padding: 4px 12px; border-radius: 4px; font-family: monospace; font-weight: bold;">${d.code}</span></p>` : ''}
              </td>
            </tr>
          </table>
        `).join('')}
      </td>
    </tr>
  ` : ''

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pick Up Yoga Newsletter</title>
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
              <p style="margin: 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 2px;">Weekly Newsletter</p>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 40px 20px;">
              <p style="margin: 0 0 16px; font-size: 18px; color: #333;">${greeting}</p>
              <p style="margin: 0; font-size: 15px; color: #555; line-height: 1.6;">${introMessage}</p>
            </td>
          </tr>
          
          ${classesHtml}
          ${teachersHtml}
          ${dealsHtml}
          
          <!-- CTA -->
          <tr>
            <td style="padding: 10px 40px 40px; text-align: center;">
              <a href="https://pikk-up.com/classes" style="display: inline-block; padding: 16px 32px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 500;">View All Classes</a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #fafafa; border-top: 1px solid #f0f0f0; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666;">See you on the mat! 🧘</p>
              <p style="margin: 0 0 20px; font-size: 12px; color: #999;">
                Questions? Reply to this email and we'll help you out.
              </p>
              <p style="margin: 0; font-size: 11px; color: #bbb;">
                <a href="${unsubscribeUrl}" style="color: #999; text-decoration: underline;">Unsubscribe</a> from these emails
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      preview = false,
      preview_email,
      subject = "This Week at Pick Up Yoga 🧘",
      intro_message = "Here's what's happening this week at Pick Up Yoga. We've got some amazing classes lined up for you!",
      deals = [] as DealInfo[],
      featured_teacher_ids = [] as string[]
    } = body

    // Fetch upcoming classes for the next 7 days
    const today = new Date()
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)

    const { data: classesData, error: classesError } = await supabaseAdmin
      .from('classes')
      .select(`
        id,
        title,
        description,
        price_cents,
        max_capacity,
        time_slots!inner(date, start_time),
        profiles!instructor_id(first_name, last_name)
      `)
      .eq('status', 'upcoming')
      .gte('time_slots.date', today.toISOString().split('T')[0])
      .lte('time_slots.date', nextWeek.toISOString().split('T')[0])
      .order('time_slots(date)', { ascending: true })
      .limit(5)

    if (classesError) {
      console.error('Error fetching classes:', classesError)
    }

    // Get booking counts for each class
    const classIds = (classesData || []).map((c: any) => c.id)
    const { data: bookingCounts } = await supabaseAdmin
      .from('bookings')
      .select('class_id')
      .in('class_id', classIds)
      .eq('status', 'confirmed')

    const countByClass: Record<string, number> = {}
    ;(bookingCounts || []).forEach((b: any) => {
      countByClass[b.class_id] = (countByClass[b.class_id] || 0) + 1
    })

    // Format classes
    const classes: ClassInfo[] = (classesData || []).map((c: any) => {
      const timeSlot = c.time_slots
      const date = new Date(timeSlot?.date)
      const timeStr = timeSlot?.start_time?.substring(0, 5) || '00:00'
      const [hours, minutes] = timeStr.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const hour12 = hour % 12 || 12
      const booked = countByClass[c.id] || 0

      return {
        id: c.id,
        title: c.title,
        description: c.description || '',
        date: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
        time: `${hour12}:${minutes} ${ampm}`,
        instructor_name: `${c.profiles?.first_name || ''} ${c.profiles?.last_name || ''}`.trim() || 'TBA',
        price_display: c.price_cents === 0 ? 'Free' : `$${(c.price_cents / 100).toFixed(0)}`,
        spots_left: Math.max(0, c.max_capacity - booked)
      }
    })

    // Fetch featured teachers
    let teachers: TeacherInfo[] = []
    if (featured_teacher_ids.length > 0) {
      const { data: teachersData } = await supabaseAdmin
        .from('profiles')
        .select('id, first_name, last_name, bio, avatar_url')
        .in('id', featured_teacher_ids)
        .eq('is_instructor', true)

      teachers = (teachersData || []).map((t: any) => ({
        id: t.id,
        name: `${t.first_name || ''} ${t.last_name || ''}`.trim(),
        bio: t.bio,
        avatar_url: t.avatar_url
      }))
    }

    // If preview mode, send to single email
    if (preview && preview_email) {
      const unsubscribeUrl = `https://pikk-up.com/unsubscribe?email=${encodeURIComponent(preview_email)}`
      const html = generateNewsletterHtml(
        'Preview User',
        classes,
        teachers,
        deals,
        intro_message,
        unsubscribeUrl
      )

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Pick Up Yoga <bookings@pikk-up.com>',
          to: [preview_email],
          subject: `[PREVIEW] ${subject}`,
          html,
        }),
      })

      const resendData = await resendResponse.json()

      if (!resendResponse.ok) {
        console.error('Resend error:', resendData)
        return NextResponse.json(
          { error: resendData.message || 'Failed to send preview' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Preview sent',
        preview_email,
        classes_count: classes.length,
        teachers_count: teachers.length,
        deals_count: deals.length
      })
    }

    // Get all active subscribers
    const { data: subscribers, error: subscribersError } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('id, email, first_name')
      .eq('is_active', true)

    if (subscribersError) {
      console.error('Subscribers error:', subscribersError)
      return NextResponse.json(
        { error: 'Failed to fetch subscribers: ' + subscribersError.message },
        { status: 500 }
      )
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json(
        { error: 'No active subscribers found' },
        { status: 400 }
      )
    }

    console.log(`Sending newsletter to ${subscribers.length} subscribers`)

    // Send to all subscribers (in batches)
    const batchSize = 50
    let sentCount = 0
    const errors: string[] = []

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize)
      
      const emailPromises = batch.map(async (subscriber: any) => {
        const unsubscribeUrl = `https://pikk-up.com/unsubscribe?email=${encodeURIComponent(subscriber.email)}&token=${Buffer.from(subscriber.id).toString('base64')}`
        const html = generateNewsletterHtml(
          subscriber.first_name,
          classes,
          teachers,
          deals,
          intro_message,
          unsubscribeUrl
        )

        try {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Pick Up Yoga <bookings@pikk-up.com>',
              to: [subscriber.email],
              subject,
              html,
              headers: {
                'List-Unsubscribe': `<${unsubscribeUrl}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
              }
            }),
          })

          if (response.ok) {
            sentCount++
            // Update subscriber record
            await supabaseAdmin
              .from('newsletter_subscribers')
              .update({
                last_email_sent_at: new Date().toISOString(),
                emails_sent_count: (subscriber.emails_sent_count || 0) + 1
              })
              .eq('id', subscriber.id)
          } else {
            const errorData = await response.json()
            errors.push(`${subscriber.email}: ${errorData.message}`)
          }
        } catch (error: any) {
          errors.push(`${subscriber.email}: ${error.message}`)
        }
      })

      await Promise.all(emailPromises)
      
      // Small delay between batches to avoid rate limits
      if (i + batchSize < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Record the campaign
    await supabaseAdmin.from('newsletter_campaigns').insert({
      subject,
      recipient_count: sentCount,
      featured_classes_json: classes,
      featured_teachers_json: teachers,
      deals_json: deals
    })

    return NextResponse.json({
      success: true,
      sent_count: sentCount,
      total_subscribers: subscribers.length,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error: any) {
    console.error('Newsletter API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get subscriber stats
export async function GET() {
  try {
    const { count: activeCount } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const { count: totalCount } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })

    const { data: recentCampaigns } = await supabaseAdmin
      .from('newsletter_campaigns')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      active_subscribers: activeCount || 0,
      total_subscribers: totalCount || 0,
      recent_campaigns: recentCampaigns || []
    })
  } catch (error: any) {
    console.error('Newsletter stats error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
