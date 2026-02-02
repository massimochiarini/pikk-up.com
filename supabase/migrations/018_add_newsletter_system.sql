-- Newsletter System
-- Tracks email subscriptions and sent newsletters

-- =====================================================
-- NEWSLETTER SUBSCRIBERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  source TEXT NOT NULL CHECK (source IN ('signup', 'booking', 'package_purchase', 'manual')),
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  -- Track engagement
  last_email_sent_at TIMESTAMPTZ,
  emails_sent_count INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Service role can manage newsletter subscribers"
  ON newsletter_subscribers FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can view their own subscription"
  ON newsletter_subscribers FOR SELECT
  USING (
    email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- =====================================================
-- NEWSLETTER CAMPAIGNS TABLE (track sent emails)
-- =====================================================
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  recipient_count INTEGER NOT NULL,
  -- Store the content for records
  featured_classes_json JSONB,
  featured_teachers_json JSONB,
  deals_json JSONB,
  created_by UUID REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage campaigns"
  ON newsletter_campaigns FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admins can view campaigns"
  ON newsletter_campaigns FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_instructor = true)
  );

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active ON newsletter_subscribers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_sent_at ON newsletter_campaigns(sent_at DESC);

-- =====================================================
-- FUNCTION: Sync existing emails to newsletter
-- =====================================================
CREATE OR REPLACE FUNCTION sync_existing_emails_to_newsletter()
RETURNS INTEGER AS $$
DECLARE
  inserted_count INTEGER := 0;
BEGIN
  -- Add emails from profiles (account signups)
  INSERT INTO newsletter_subscribers (email, first_name, source)
  SELECT DISTINCT 
    LOWER(TRIM(p.email)),
    p.first_name,
    'signup'
  FROM profiles p
  WHERE p.email IS NOT NULL 
    AND p.email != ''
    AND NOT EXISTS (
      SELECT 1 FROM newsletter_subscribers ns 
      WHERE LOWER(TRIM(ns.email)) = LOWER(TRIM(p.email))
    )
  ON CONFLICT (email) DO NOTHING;
  
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  
  -- Add emails from guest bookings
  INSERT INTO newsletter_subscribers (email, first_name, source)
  SELECT DISTINCT 
    LOWER(TRIM(b.guest_email)),
    b.guest_first_name,
    'booking'
  FROM bookings b
  WHERE b.guest_email IS NOT NULL 
    AND b.guest_email != ''
    AND NOT EXISTS (
      SELECT 1 FROM newsletter_subscribers ns 
      WHERE LOWER(TRIM(ns.email)) = LOWER(TRIM(b.guest_email))
    )
  ON CONFLICT (email) DO NOTHING;
  
  -- Add emails from guest package purchases
  INSERT INTO newsletter_subscribers (email, first_name, source)
  SELECT DISTINCT 
    LOWER(TRIM(pc.guest_email)),
    NULL,
    'package_purchase'
  FROM package_credits pc
  WHERE pc.guest_email IS NOT NULL 
    AND pc.guest_email != ''
    AND NOT EXISTS (
      SELECT 1 FROM newsletter_subscribers ns 
      WHERE LOWER(TRIM(ns.email)) = LOWER(TRIM(pc.guest_email))
    )
  ON CONFLICT (email) DO NOTHING;
  
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: Auto-add new signups to newsletter
-- =====================================================
CREATE OR REPLACE FUNCTION add_profile_to_newsletter()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO newsletter_subscribers (email, first_name, source)
  VALUES (LOWER(TRIM(NEW.email)), NEW.first_name, 'signup')
  ON CONFLICT (email) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, newsletter_subscribers.first_name),
    is_active = true,
    unsubscribed_at = NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_add_newsletter ON profiles;
CREATE TRIGGER on_profile_created_add_newsletter
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION add_profile_to_newsletter();

-- =====================================================
-- TRIGGER: Auto-add guest bookings to newsletter
-- =====================================================
CREATE OR REPLACE FUNCTION add_booking_guest_to_newsletter()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.guest_email IS NOT NULL AND NEW.guest_email != '' THEN
    INSERT INTO newsletter_subscribers (email, first_name, source)
    VALUES (LOWER(TRIM(NEW.guest_email)), NEW.guest_first_name, 'booking')
    ON CONFLICT (email) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_booking_created_add_newsletter ON bookings;
CREATE TRIGGER on_booking_created_add_newsletter
  AFTER INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION add_booking_guest_to_newsletter();

-- =====================================================
-- Run initial sync
-- =====================================================
SELECT sync_existing_emails_to_newsletter();
