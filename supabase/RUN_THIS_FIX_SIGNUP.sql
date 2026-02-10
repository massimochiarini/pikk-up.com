-- =============================================================================
-- RUN THIS ENTIRE FILE IN SUPABASE SQL EDITOR (one click) TO FIX SIGNUP
-- Supabase Dashboard → SQL Editor → New query → paste this → Run
-- =============================================================================

-- 1. Create newsletter tables so nothing references missing relations
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
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read newsletter_subscribers for authenticated" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow insert newsletter_subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow update newsletter_subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow read newsletter_campaigns" ON public.newsletter_campaigns;
DROP POLICY IF EXISTS "Allow insert newsletter_campaigns" ON public.newsletter_campaigns;
CREATE POLICY "Allow read newsletter_subscribers for authenticated" ON public.newsletter_subscribers FOR SELECT USING (true);
CREATE POLICY "Allow insert newsletter_subscribers" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update newsletter_subscribers" ON public.newsletter_subscribers FOR UPDATE USING (true);
CREATE POLICY "Allow read newsletter_campaigns" ON public.newsletter_campaigns FOR SELECT USING (true);
CREATE POLICY "Allow insert newsletter_campaigns" ON public.newsletter_campaigns FOR INSERT WITH CHECK (true);

-- 2. Fix profiles INSERT so the signup trigger can create a profile (RLS was blocking it)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id
    OR (auth.uid() IS NULL AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = id))
    OR auth.role() = 'service_role'
    OR auth.role() = 'postgres'
    OR auth.role() = 'supabase_auth_admin'
    OR NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = id)
  );

-- 3. Replace the trigger so it creates the profile on signup (safe casting, no errors)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_instructor text;
  instr_status text;
  v_first_name text;
  v_last_name text;
  v_phone text;
BEGIN
  meta_instructor := COALESCE(NEW.raw_user_meta_data->>'is_instructor', '');
  instr_status := CASE WHEN meta_instructor IN ('true', '1', 'yes') THEN 'pending' ELSE 'none' END;
  v_first_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), ''), split_part(COALESCE(NEW.email, ''), '@', 1));
  v_last_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'), ''), '');
  v_phone := NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), '');

  INSERT INTO public.profiles (id, email, first_name, last_name, is_instructor, instructor_status, phone)
  VALUES (NEW.id, COALESCE(NEW.email, ''), v_first_name, v_last_name, false, instr_status, v_phone)
  ON CONFLICT (id) DO UPDATE SET
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name);
  RETURN NEW;
END;
$$;

-- 4. Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Try to give the function an owner that bypasses RLS (ignore errors)
DO $$
BEGIN
  ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
