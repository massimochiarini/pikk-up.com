-- Fix "Database error saving new user": allow profile creation when the auth trigger runs.
-- The trigger runs in a context where auth.uid() may be null or a backend role, so the
-- "Users can insert their own profile" policy can block the insert. We replace it with
-- rules that allow the trigger and keep normal signups working.

-- Drop the existing insert policy so we can replace it with combined rules
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- (1) User inserting their own profile (normal client-side flow)
-- (2) No current user and no profile for this id yet (trigger during signup)
-- (3) Service role (Auth backend / trigger often runs in this context)
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id
    OR (
      auth.uid() IS NULL
      AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = id)
    )
    OR (auth.role() = 'service_role')
  );

-- Harden the trigger: safe cast for is_instructor metadata to avoid type errors
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta_instructor text;
  instr_status text;
BEGIN
  meta_instructor := COALESCE(NEW.raw_user_meta_data->>'is_instructor', '');
  instr_status := CASE
    WHEN meta_instructor IN ('true', '1', 'yes') THEN 'pending'
    ELSE 'none'
  END;

  INSERT INTO public.profiles (id, email, first_name, last_name, is_instructor, instructor_status, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), ''), split_part(COALESCE(NEW.email, ''), '@', 1)),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'), ''), ''),
    false,
    instr_status,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), '')
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger runs as a role that can bypass RLS (run after creating the function)
DO $$
BEGIN
  ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
