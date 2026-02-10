-- Funnel: email capture source, first-class-free tokens, automation tracking
-- 1. newsletter_subscribers: track source (bio vs newsletter) and lead follow-up sent
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'newsletter',
  ADD COLUMN IF NOT EXISTS lead_followup_sent_at TIMESTAMPTZ;

-- 2. First-class-free tokens: time-limited, one-time use per email
CREATE TABLE IF NOT EXISTS public.first_class_free_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  booking_id UUID REFERENCES bookings(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_first_class_free_tokens_email ON public.first_class_free_tokens(email);
CREATE INDEX IF NOT EXISTS idx_first_class_free_tokens_expires ON public.first_class_free_tokens(expires_at) WHERE used_at IS NULL;

ALTER TABLE public.first_class_free_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access first_class_free_tokens" ON public.first_class_free_tokens;
CREATE POLICY "Service role full access first_class_free_tokens"
  ON public.first_class_free_tokens FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 3. Bookings: track pre-class reminder and post-class follow-up sent
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS pre_class_reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS post_class_followup_sent_at TIMESTAMPTZ;

-- 4. Rebook nudge: one-time nudge per (guest_email, new class) when same instructor posts same class again
CREATE TABLE IF NOT EXISTS public.rebook_nudge_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_email TEXT NOT NULL,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guest_email, class_id)
);

CREATE INDEX IF NOT EXISTS idx_rebook_nudge_sent_email ON public.rebook_nudge_sent(guest_email);

ALTER TABLE public.rebook_nudge_sent ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access rebook_nudge_sent" ON public.rebook_nudge_sent;
CREATE POLICY "Service role full access rebook_nudge_sent"
  ON public.rebook_nudge_sent FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
