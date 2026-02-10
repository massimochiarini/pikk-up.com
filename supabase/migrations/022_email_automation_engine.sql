-- Email Automation Engine: tracking jobs and behavior events
-- 1. email_jobs: stores scheduled emails to be sent
CREATE TABLE IF NOT EXISTS public.email_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  type TEXT NOT NULL, -- e.g. lead_no_booking_1, lead_no_booking_2, pre_class_reminder, post_class_followup, rebook_nudge
  payload JSONB DEFAULT '{}',
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for finding due jobs efficiently
CREATE INDEX IF NOT EXISTS idx_email_jobs_due ON public.email_jobs(scheduled_for) 
  WHERE sent_at IS NULL AND canceled_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_email_jobs_email_type ON public.email_jobs(email, type);

-- 2. email_events: tracks user behavior for trigger logic
CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  event_type TEXT NOT NULL, -- e.g. lead_captured, booked, attended, email_sent
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_events_email ON public.email_events(email);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON public.email_events(event_type);

-- RLS
ALTER TABLE public.email_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access email_jobs" ON public.email_jobs;
CREATE POLICY "Service role full access email_jobs"
  ON public.email_jobs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access email_events" ON public.email_events;
CREATE POLICY "Service role full access email_events"
  ON public.email_events FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
