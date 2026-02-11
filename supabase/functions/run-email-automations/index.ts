// EMAIL AUTOMATION DEPLOYMENT CHECKLIST:
// 1. Deploy this function:
//    npx supabase functions deploy run-email-automations
// 2. Set environment secrets in Supabase:
//    npx supabase secrets set RESEND_API_KEY=re_xxx
//    npx supabase secrets set EMAIL_AUTOMATIONS_ENABLED=true
// 3. Verify domain in Resend dashboard (from: updates@pikk-up.com)
// 4. Schedule the function to run every 10 mins (Supabase dashboard -> Cron):
//    SELECT cron.schedule('run-email-automations', '*/10 * * * *', 'SELECT net.http_post(url:=''https://<project-id>.supabase.co/functions/v1/run-email-automations'', headers:=''{"Authorization": "Bearer <service-role-key>"}'')');

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getEmailTemplate } from './templates.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const ENABLED = Deno.env.get('EMAIL_AUTOMATIONS_ENABLED') === 'true'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

  try {
    // 1. Fetch due jobs
    const { data: jobs, error: fetchError } = await supabase
      .from('email_jobs')
      .select('*')
      .is('sent_at', null)
      .is('canceled_at', null)
      .lte('scheduled_for', new Date().toISOString())
      .limit(10) // Process in small batches

    if (fetchError) throw fetchError

    console.log(`Processing ${jobs?.length || 0} due email jobs`)

    for (const job of jobs || []) {
      try {
        if (!ENABLED) {
          console.log(`Skipping send for job ${job.id} - automations disabled globally.`)
          await supabase.from('email_jobs').update({ 
            canceled_at: new Date().toISOString(),
            error: 'Skipped - Automations globally disabled'
          }).eq('id', job.id)
          continue
        }

        // 2. Double check if user has unsubscribed
        const { data: subscriber } = await supabase
          .from('newsletter_subscribers')
          .select('is_active')
          .eq('email', job.email)
          .single()

        if (subscriber && subscriber.is_active === false) {
          console.log(`Skipping job ${job.id} - user unsubscribed: ${job.email}`)
          await supabase.from('email_jobs').update({ canceled_at: new Date().toISOString() }).eq('id', job.id)
          continue
        }

        // 3. Send via Resend using templates
        const { subject, html } = getEmailTemplate(job.type, job.email, job.payload)

        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Pick Up Yoga <updates@pikk-up.com>',
            to: [job.email],
            subject,
            html,
          }),
        })

        const resendData = await resendResponse.json()

        if (resendResponse.ok) {
          // 4. Mark as sent and track event
          await supabase.from('email_jobs').update({ sent_at: new Date().toISOString() }).eq('id', job.id)
          await supabase.from('email_events').insert({
            email: job.email,
            event_type: 'email_sent',
            metadata: { job_id: job.id, type: job.type }
          })
          console.log(`Successfully sent email job ${job.id} to ${job.email}`)
        } else {
          throw new Error(resendData.message || 'Resend error')
        }
      } catch (err: any) {
        console.error(`Error processing job ${job.id}:`, err.message)
        await supabase.from('email_jobs').update({ error: err.message }).eq('id', job.id)
      }
    }

    // 5. Maintenance: Generate rebook nudges (run once per hour-ish)
    // We can use a simple flag in the DB or just run it and let the 'existing job' check handle it
    await generateRebookNudges(supabase)

    return new Response(JSON.stringify({ success: true, processed: jobs?.length || 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Automation runner error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function generateRebookNudges(supabase: any) {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    // Find classes created in last 24h
    const { data: newClasses } = await supabase
      .from('classes')
      .select('id, title, instructor_id, time_slot:time_slots(date, start_time), instructor:profiles!classes_instructor_id_fkey(first_name)')
      .gt('created_at', twentyFourHoursAgo)

    if (!newClasses) return

    for (const newClass of newClasses) {
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      
      // Find past attendees of this instructor
      // Use !inner for filtering by joined table
      const { data: pastAttendees, error: attendeesError } = await supabase
        .from('bookings')
        .select('guest_email, classes!inner(instructor_id)')
        .eq('status', 'confirmed')
        .eq('classes.instructor_id', newClass.instructor_id)
        .gt('created_at', fourteenDaysAgo)

      if (attendeesError) {
        console.error('Error fetching past attendees:', attendeesError)
        continue
      }
      if (!pastAttendees) continue
      const emails = [...new Set(pastAttendees.map((b: any) => b.guest_email?.toLowerCase().trim()))].filter(Boolean)

    for (const email of emails) {
      // --- NEW: Throttling Logic ---
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

      // 1. Check engagement
      const { count: clickCount } = await supabase.from('email_events').select('*', { count: 'exact', head: true }).eq('email', email).eq('event_type', 'clicked').gt('created_at', sevenDaysAgo)
      const { count: bookingCount } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('guest_email', email).eq('status', 'confirmed').gt('created_at', thirtyDaysAgo)
      const isHighEngagement = (clickCount || 0) > 0 || (bookingCount || 0) > 0

      // 2. Count sent
      const { count: sentCount } = await supabase.from('email_jobs').select('*', { count: 'exact', head: true }).eq('email', email).not('sent_at', 'is', null).gt('sent_at', sevenDaysAgo)

      if ((sentCount || 0) >= (isHighEngagement ? 3 : 1)) {
        console.log(`Skipping nudge for ${email} - over limit (${sentCount} sent)`)
        continue
      }
      // -----------------------------

      // Check if nudge already enqueued for this class
      const { data: existing } = await supabase
        .from('email_jobs')
        .select('id')
        .eq('email', email)
        .eq('type', 'rebook_nudge')
        .contains('payload', { classId: newClass.id })
        .single()

      if (existing) continue

      const classStart = new Date(`${newClass.time_slot.date}T${newClass.time_slot.start_time}`)
        const nudgeTime = new Date(classStart.getTime() - 48 * 60 * 60 * 1000)

        if (nudgeTime > new Date()) {
          // Try to find attendee's first name
          const { data: attendeeProfile } = await supabase
            .from('profiles')
            .select('first_name')
            .eq('email', email)
            .single()

          await supabase.from('email_jobs').insert({
            email,
            type: 'rebook_nudge',
            scheduled_for: nudgeTime.toISOString(),
            payload: {
              classId: newClass.id,
              firstName: attendeeProfile?.first_name || 'there',
              sessionTitle: newClass.title,
              instructorName: newClass.instructor.first_name,
              sessionTime: `${newClass.time_slot.date} at ${newClass.time_slot.start_time}`
            }
          })
        }
      }
    }
  } catch (err) {
    console.error('Error generating rebook nudges:', err)
  }
}
