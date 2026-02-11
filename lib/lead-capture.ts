import { createServerClient } from '@/lib/supabase'
import crypto from 'crypto'

export type LeadSource = 'landing_gate' | 'instructor_post' | 'footer' | 'newsletter' | 'bio' | string
export type RolePreference = 'student' | 'teacher' | 'unknown'

export interface UpsertSubscriberOptions {
  first_name?: string | null
  source: LeadSource
  role_preference?: RolePreference | null
  /** When true, generates and stores free_pass_token + free_pass_expires_at (e.g. 24h). Does not overwrite an existing valid token. */
  issueFreePass?: boolean
  /** Hours until free pass expires (default 24). Used only when issueFreePass is true. */
  freePassExpiryHours?: number
}

export interface UpsertSubscriberResult {
  id: string
  email: string
  created: boolean
  first_name?: string | null
  free_pass_token?: string | null
  free_pass_expires_at?: string | null
}

/**
 * Upsert a subscriber by email. Reuses newsletter_subscribers.
 * - New row: inserts with is_active = true (table default). Optionally sets free_pass_* when issueFreePass.
 * - Existing row: updates only source, role_preference, last_seen_at, and optionally free_pass_*.
 *   Does NOT set is_active or unsubscribed_at, so unsubscribed users stay unsubscribed until they explicitly resubscribe.
 */
export async function upsertSubscriber(
  email: string,
  options: UpsertSubscriberOptions
): Promise<UpsertSubscriberResult> {
  const supabase = createServerClient()
  const normalizedEmail = email.toLowerCase().trim()

  const now = new Date().toISOString()
  let freePassToken: string | null = null
  let freePassExpiresAt: string | null = null

  if (options.issueFreePass) {
    const hours = options.freePassExpiryHours ?? 24
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + hours)
    freePassToken = crypto.randomBytes(32).toString('hex')
    freePassExpiresAt = expiresAt.toISOString()
  }

  const insertPayload: Record<string, unknown> = {
    email: normalizedEmail,
    source: options.source,
    last_seen_at: now,
    ...(options.first_name !== undefined && { first_name: options.first_name || null }),
    ...(options.role_preference !== undefined && { role_preference: options.role_preference || null }),
    ...(freePassToken && freePassExpiresAt && {
      free_pass_token: freePassToken,
      free_pass_expires_at: freePassExpiresAt,
    }),
  }

  const { data: existing } = await supabase
    .from('newsletter_subscribers')
    .select('id, free_pass_token, free_pass_expires_at, free_pass_used_at')
    .eq('email', normalizedEmail)
    .single()

  if (existing) {
    const hasValidPass =
      existing.free_pass_token &&
      existing.free_pass_expires_at &&
      !existing.free_pass_used_at &&
      new Date(existing.free_pass_expires_at) > new Date()
    const includeFreePass = options.issueFreePass && !hasValidPass

    const updatePayload: Record<string, unknown> = {
      source: options.source,
      last_seen_at: now,
      ...(options.first_name !== undefined && { first_name: options.first_name || null }),
      ...(options.role_preference !== undefined && { role_preference: options.role_preference || null }),
      ...(includeFreePass && freePassToken && freePassExpiresAt && {
        free_pass_token: freePassToken,
        free_pass_expires_at: freePassExpiresAt,
      }),
    }

    const { data: updated, error } = await supabase
      .from('newsletter_subscribers')
      .update(updatePayload)
      .eq('email', normalizedEmail)
      .select('id, email, first_name, free_pass_token, free_pass_expires_at')
      .single()

    if (error) throw error
    return {
      id: updated.id,
      email: updated.email,
      created: false,
      first_name: updated.first_name ?? undefined,
      free_pass_token: updated.free_pass_token ?? undefined,
      free_pass_expires_at: updated.free_pass_expires_at ?? undefined,
    }
  }

  const { data: inserted, error } = await supabase
    .from('newsletter_subscribers')
    .insert(insertPayload)
    .select('id, email, first_name, free_pass_token, free_pass_expires_at')
    .single()

  if (error) throw error
  return {
    id: inserted.id,
    email: inserted.email,
    created: true,
    first_name: inserted.first_name ?? undefined,
    free_pass_token: inserted.free_pass_token ?? undefined,
    free_pass_expires_at: inserted.free_pass_expires_at ?? undefined,
  }
}

/**
 * Get valid free pass info for a given email.
 * Returns the token and expiry if a pass exists, is not expired, and not used.
 */
export async function getFreePassForEmail(email: string) {
  const supabase = createServerClient()
  const normalizedEmail = email.toLowerCase().trim()

  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('free_pass_token, free_pass_expires_at, free_pass_used_at')
    .eq('email', normalizedEmail)
    .single()

  if (error || !data || !data.free_pass_token || data.free_pass_used_at) {
    return null
  }

  const expiresAt = data.free_pass_expires_at ? new Date(data.free_pass_expires_at) : null
  if (expiresAt && expiresAt < new Date()) {
    return null
  }

  return {
    token: data.free_pass_token,
    expiresAt: data.free_pass_expires_at,
  }
}

/**
 * Mark a free pass as used for a specific subscriber.
 */
export async function consumeFreePass(token: string, bookingId: string) {
  const supabase = createServerClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({
      free_pass_used_at: now,
      last_booking_at: now,
    })
    .eq('free_pass_token', token)

  return { success: !error, error }
}


