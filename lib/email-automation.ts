import { createServerClient } from '@/lib/supabase'

export type EmailJobType = 
  | 'lead_no_booking_1' 
  | 'lead_no_booking_2' 
  | 'pre_class_reminder' 
  | 'post_class_followup' 
  | 'rebook_nudge'

/**
 * Check if we can send an email to this user based on engagement rules.
 * Rules:
 * - Unsubscribed: Never.
 * - High Engagement (Clicked 7d OR Booked 30d): Max 3/week.
 * - Low Engagement: Max 1/week.
 */
export async function canSendEmail(email: string): Promise<boolean> {
  const supabase = createServerClient()
  const normalizedEmail = email.toLowerCase().trim()
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // 1. Check if unsubscribed
  const { data: sub } = await supabase
    .from('newsletter_subscribers')
    .select('is_active')
    .eq('email', normalizedEmail)
    .single()
  
  if (sub && sub.is_active === false) return false

  // 2. Check for high engagement (clicks in 7d or bookings in 30d)
  const { count: clickCount } = await supabase
    .from('email_events')
    .select('*', { count: 'exact', head: true })
    .eq('email', normalizedEmail)
    .eq('event_type', 'clicked')
    .gt('created_at', sevenDaysAgo)

  const { count: bookingCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('guest_email', normalizedEmail)
    .eq('status', 'confirmed')
    .gt('created_at', thirtyDaysAgo)

  const isHighEngagement = (clickCount || 0) > 0 || (bookingCount || 0) > 0

  // 3. Count sent emails in last 7 days
  const { count: sentCount } = await supabase
    .from('email_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('email', normalizedEmail)
    .not('sent_at', 'is', null)
    .gt('sent_at', sevenDaysAgo)

  const limit = isHighEngagement ? 3 : 1
  return (sentCount || 0) < limit
}

/**
 * Enqueue an email job to be sent at a future time.
 * Automatically checks throttling rules.
 */
export async function enqueueEmailJob(
  email: string,
  type: EmailJobType,
  scheduledFor: Date,
  payload: Record<string, any> = {}
) {
  // Check throttling rules first
  const allowed = await canSendEmail(email)
  if (!allowed) {
    console.log(`Email job [${type}] throttled for ${email}`)
    return null
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('email_jobs')
    .insert({
      email: email.toLowerCase().trim(),
      type,
      payload,
      scheduled_for: scheduledFor.toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error enqueuing email job:', error)
    return null
  }
  return data
}

/**
 * Cancel pending email jobs for a specific email and optionally specific types.
 */
export async function cancelEmailJobs(email: string, types?: EmailJobType[]) {
  const supabase = createServerClient()
  let query = supabase
    .from('email_jobs')
    .update({ canceled_at: new Date().toISOString() })
    .eq('email', email.toLowerCase().trim())
    .is('sent_at', null)
    .is('canceled_at', null)

  if (types && types.length > 0) {
    query = query.in('type', types)
  }

  const { error } = await query
  if (error) {
    console.error('Error canceling email jobs:', error)
  }
}

/**
 * Track an email event (behavioral data).
 */
export async function trackEmailEvent(
  email: string,
  eventType: string,
  metadata: Record<string, any> = {}
) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from('email_events')
    .insert({
      email: email.toLowerCase().trim(),
      event_type: eventType,
      metadata,
    })

  if (error) {
    console.error('Error tracking email event:', error)
  }
}
