-- Lead capture: extend newsletter_subscribers for funnel (reuse table, no new table)
-- Keeps UNIQUE(email). Unsubscribed users are not reactivated by upserts; only explicit resubscribe should set is_active.

ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'newsletter',
  ADD COLUMN IF NOT EXISTS role_preference TEXT,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_booking_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS free_pass_token TEXT,
  ADD COLUMN IF NOT EXISTS free_pass_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS free_pass_used_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '{}';

-- Keep existing columns as-is: is_active, unsubscribed_at, emails_sent_count, last_email_sent_at
-- UNIQUE(email) already exists on the table (from 019)

CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_subscribers_free_pass_token
  ON public.newsletter_subscribers(free_pass_token)
  WHERE free_pass_token IS NOT NULL;

COMMENT ON COLUMN public.newsletter_subscribers.source IS 'e.g. landing_gate, instructor_post, footer';
COMMENT ON COLUMN public.newsletter_subscribers.role_preference IS 'student, teacher, or unknown';
COMMENT ON COLUMN public.newsletter_subscribers.free_pass_token IS 'One-time free pass token; use with free_pass_expires_at and free_pass_used_at';
