import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const RESEND_API_KEY = process.env.RESEND_API_KEY
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pikk-up.com'

function unsubscribeUrl(email: string) {
  return `${SITE_URL}/unsubscribe?email=${encodeURIComponent(email)}`
}

function buildFooterHtml(email: string) {
  return `
  <tr>
    <td style="padding: 20px 40px; background-color: #fafafa; border-top: 1px solid #f0f0f0; text-align: center;">
      <p style="margin: 0 0 10px; font-size: 12px; color: #999;">
        <a href="${unsubscribeUrl(email)}" style="color: #999; text-decoration: underline;">Unsubscribe</a> from these emails
      </p>
    </td>
  </tr>`
}

async function isUnsubscribed(email: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('newsletter_subscribers')
    .select('is_active')
    .eq('email', email.toLowerCase().trim())
    .single()
  return data ? data.is_active === false : false
}

async function sendResend(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) return false
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Pick Up Yoga <bookings@pikk-up.com>',
      to: [to],
      subject,
      html,
    }),
  })
  return res.ok
}

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret') || request.headers.get('authorization')?.replace('Bearer ', '')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = { leadFollowup: 0, preClassReminder: 0, postClassFollowup: 0, rebookNudge: 0 }

  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not set', results }, { status: 500 })
  }

  const now = new Date()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  // 1. Lead follow-up: bio captures with no booking, created > 24h ago
  const { data: leadSubscribers } = await supabaseAdmin
    .from('newsletter_subscribers')
    .select('id, email, first_name')
    .eq('source', 'bio')
    .eq('is_active', true)
    .is('lead_followup_sent_at', null)
    .lt('created_at', twentyFourHoursAgo.toISOString())

  if (leadSubscribers?.length) {
    for (const sub of leadSubscribers) {
      const { data: hasBooking } = await supabaseAdmin
        .from('bookings')
        .select('id')
        .eq('guest_email', sub.email)
        .eq('status', 'confirmed')
        .limit(1)
        .single()
      if (hasBooking) continue

      const name = sub.first_name || 'there'
      const html = `
<!DOCTYPE html><html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 40px 20px;">
  <table role="presentation" style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <tr><td style="padding: 40px; text-align: center; border-bottom: 1px solid #f0f0f0;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 300; color: #1a1a1a;">PikkUp</h1>
    </td></tr>
    <tr><td style="padding: 30px;">
      <p style="margin: 0 0 16px; font-size: 16px; color: #333;">Hi ${name},</p>
      <p style="margin: 0 0 16px; font-size: 15px; color: #555; line-height: 1.6;">You signed up to see our classes — here’s a quick reminder that your first class can be free when you book within 24 hours of clicking your link.</p>
      <p style="margin: 0 0 24px; font-size: 15px; color: #555; line-height: 1.6;">Browse classes and reserve your spot:</p>
      <a href="${SITE_URL}/classes" style="display: inline-block; padding: 12px 24px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px;">View classes</a>
    </td></tr>
    ${buildFooterHtml(sub.email)}
  </table>
</body></html>`
      const ok = await sendResend(sub.email, "Your first class free — don't miss it", html)
      if (ok) {
        await supabaseAdmin.from('newsletter_subscribers').update({ lead_followup_sent_at: now.toISOString() }).eq('id', sub.id)
        results.leadFollowup++
      }
    }
  }

  // 2. Pre-class reminder: bookings in the next 24h that haven't had reminder sent
  const { data: bookingsWithClass } = await supabaseAdmin
    .from('bookings')
    .select(`
      id,
      guest_email,
      guest_first_name,
      pre_class_reminder_sent_at,
      class_id,
      classes!inner(id, title, time_slot_id, instructor:profiles!instructor_id(first_name, last_name))
    `)
    .eq('status', 'confirmed')
    .not('guest_email', 'is', null)
    .is('pre_class_reminder_sent_at', null)

  for (const b of bookingsWithClass || []) {
    const c = (b as any).classes
    if (!c?.time_slot_id) continue
    const { data: slot } = await supabaseAdmin.from('time_slots').select('date, start_time').eq('id', c.time_slot_id).single()
    if (!slot) continue
    const ts = slot as { date: string; start_time: string }
    const classStart = new Date(ts.date + 'T' + ts.start_time)
    if (classStart < now || classStart > twentyFourHoursFromNow) continue

    const email = (b as any).guest_email
    if (await isUnsubscribed(email)) continue

    const instructor = c.instructor as { first_name: string; last_name: string } | null
    const instructorName = instructor ? `${instructor.first_name} ${instructor.last_name}` : 'your instructor'
    const firstName = (b as any).guest_first_name || 'there'
    const html = `
<!DOCTYPE html><html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 40px 20px;">
  <table role="presentation" style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <tr><td style="padding: 40px; text-align: center; border-bottom: 1px solid #f0f0f0;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 300; color: #1a1a1a;">PikkUp</h1>
      <p style="margin: 8px 0 0; font-size: 14px; color: #666;">Class reminder</p>
    </td></tr>
    <tr><td style="padding: 30px;">
      <p style="margin: 0 0 16px; font-size: 16px; color: #333;">Hi ${firstName},</p>
      <p style="margin: 0 0 16px; font-size: 15px; color: #555; line-height: 1.6;">Reminder: your class <strong>${c.title}</strong> with ${instructorName} is coming up.</p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #666;">📅 ${ts.date} at ${ts.start_time.slice(0, 5)}</p>
      <p style="margin: 0 0 24px; font-size: 14px; color: #666;">📍 PickUp Studio, 2500 South Miami Avenue</p>
      <a href="${SITE_URL}/classes" style="display: inline-block; padding: 12px 24px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px;">View classes</a>
    </td></tr>
    ${buildFooterHtml(email)}
  </table>
</body></html>`
    const ok = await sendResend(email, `Reminder: ${c.title} tomorrow`, html)
    if (ok) {
      await supabaseAdmin.from('bookings').update({ pre_class_reminder_sent_at: now.toISOString() }).eq('id', b.id)
      results.preClassReminder++
    }
  }

  // 3. Post-class follow-up: class date/time has passed, post_class_followup_sent_at is null
  const { data: pastBookings } = await supabaseAdmin
    .from('bookings')
    .select(`
      id,
      guest_email,
      guest_first_name,
      class_id,
      classes!inner(id, title, time_slot_id, instructor:profiles!instructor_id(first_name, last_name))
    `)
    .eq('status', 'confirmed')
    .not('guest_email', 'is', null)
    .is('post_class_followup_sent_at', null)

  for (const b of pastBookings || []) {
    const c = (b as any).classes
    if (!c?.time_slot_id) continue
    const { data: slot } = await supabaseAdmin.from('time_slots').select('date, start_time').eq('id', c.time_slot_id).single()
    if (!slot) continue
    const classEnd = new Date(slot.date + 'T' + slot.start_time)
    classEnd.setHours(classEnd.getHours() + 1)
    if (classEnd > now) continue

    const email = (b as any).guest_email
    if (await isUnsubscribed(email)) continue

    const instructor = c.instructor as { first_name: string; last_name: string } | null
    const instructorName = instructor ? `${instructor.first_name} ${instructor.last_name}` : 'your instructor'
    const firstName = (b as any).guest_first_name || 'there'
    const html = `
<!DOCTYPE html><html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 40px 20px;">
  <table role="presentation" style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <tr><td style="padding: 40px; text-align: center; border-bottom: 1px solid #f0f0f0;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 300; color: #1a1a1a;">PikkUp</h1>
    </td></tr>
    <tr><td style="padding: 30px;">
      <p style="margin: 0 0 16px; font-size: 16px; color: #333;">Hi ${firstName},</p>
      <p style="margin: 0 0 16px; font-size: 15px; color: #555; line-height: 1.6;">How was <strong>${c.title}</strong> with ${instructorName}? We hope you had a great practice.</p>
      <p style="margin: 0 0 24px; font-size: 15px; color: #555; line-height: 1.6;">See what’s coming up and book your next class:</p>
      <a href="${SITE_URL}/classes" style="display: inline-block; padding: 12px 24px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px;">View classes</a>
    </td></tr>
    ${buildFooterHtml(email)}
  </table>
</body></html>`
    const ok = await sendResend(email, `How was ${c.title}?`, html)
    if (ok) {
      await supabaseAdmin.from('bookings').update({ post_class_followup_sent_at: now.toISOString() }).eq('id', b.id)
      results.postClassFollowup++
    }
  }

  // 4. Rebook nudge: same instructor posted a new class with same title; notify past attendees of *other* classes (same title/instructor) once
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const { data: newClasses } = await supabaseAdmin
    .from('classes')
    .select('id, title, instructor_id, created_at')
    .eq('status', 'upcoming')
    .gte('created_at', oneDayAgo.toISOString())

  for (const newClass of newClasses || []) {
    const pastBookingsForSame = await supabaseAdmin
      .from('bookings')
      .select('id, guest_email, guest_first_name, classes!inner(id, instructor_id, title)')
      .eq('status', 'confirmed')
      .not('guest_email', 'is', null)

    const pastSame: { guest_email: string; guest_first_name: string }[] = []
    for (const row of pastBookingsForSame.data || []) {
      const cls = (row as any).classes
      if (!cls || !(row as any).guest_email) continue
      if (cls.id === newClass.id) continue
      if (cls.instructor_id === newClass.instructor_id && cls.title === newClass.title) {
        pastSame.push({
          guest_email: (row as any).guest_email,
          guest_first_name: (row as any).guest_first_name || 'there',
        })
      }
    }

    const { data: alreadySent } = await supabaseAdmin
      .from('rebook_nudge_sent')
      .select('guest_email')
      .eq('class_id', newClass.id)

    const sentEmails = new Set((alreadySent || []).map((s: { guest_email: string }) => s.guest_email))
    const { data: instructorProfile } = await supabaseAdmin.from('profiles').select('first_name, last_name').eq('id', newClass.instructor_id).single()
    const instructorName = instructorProfile ? `${instructorProfile.first_name} ${instructorProfile.last_name}` : 'Your instructor'

    for (const { guest_email, guest_first_name } of pastSame) {
      if (sentEmails.has(guest_email)) continue
      if (await isUnsubscribed(guest_email)) continue

      const firstName = guest_first_name || 'there'
      const html = `
<!DOCTYPE html><html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 40px 20px;">
  <table role="presentation" style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
    <tr><td style="padding: 40px; text-align: center; border-bottom: 1px solid #f0f0f0;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 300; color: #1a1a1a;">PikkUp</h1>
    </td></tr>
    <tr><td style="padding: 30px;">
      <p style="margin: 0 0 16px; font-size: 16px; color: #333;">Hi ${firstName},</p>
      <p style="margin: 0 0 16px; font-size: 15px; color: #555; line-height: 1.6;">${instructorName} just posted <strong>${newClass.title}</strong> again. Book your spot if you’d like to join.</p>
      <a href="${SITE_URL}/book/${newClass.id}" style="display: inline-block; padding: 12px 24px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px;">Book this class</a>
    </td></tr>
    ${buildFooterHtml(guest_email)}
  </table>
</body></html>`
      const ok = await sendResend(guest_email, `${instructorName} just posted ${newClass.title} again`, html)
      if (ok) {
        await supabaseAdmin.from('rebook_nudge_sent').insert({ guest_email, class_id: newClass.id })
        sentEmails.add(guest_email)
        results.rebookNudge++
      }
    }
  }

  return NextResponse.json({ success: true, results })
}
