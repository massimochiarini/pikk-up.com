-- Newsletter feature: create tables if they don't exist.
-- Run this in its own SQL Editor execution so signup/migrations don't fail on missing relation.

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  first_name TEXT,
  is_active BOOLEAN DEFAULT true,
  unsubscribed_at TIMESTAMPTZ,
  last_email_sent_at TIMESTAMPTZ,
  emails_sent_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email)
);

CREATE TABLE IF NOT EXISTS public.newsletter_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  featured_classes_json JSONB,
  featured_teachers_json JSONB,
  deals_json JSONB
);

-- RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read newsletter_subscribers for authenticated" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow insert newsletter_subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow update newsletter_subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow read newsletter_campaigns" ON public.newsletter_campaigns;
DROP POLICY IF EXISTS "Allow insert newsletter_campaigns" ON public.newsletter_campaigns;

CREATE POLICY "Allow read newsletter_subscribers for authenticated"
  ON public.newsletter_subscribers FOR SELECT USING (true);
CREATE POLICY "Allow insert newsletter_subscribers"
  ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update newsletter_subscribers"
  ON public.newsletter_subscribers FOR UPDATE USING (true);
CREATE POLICY "Allow read newsletter_campaigns"
  ON public.newsletter_campaigns FOR SELECT USING (true);
CREATE POLICY "Allow insert newsletter_campaigns"
  ON public.newsletter_campaigns FOR INSERT WITH CHECK (true);
