-- Add instructor approval workflow
-- This migration adds an instructor_status field to track approval state

-- Add instructor_status column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS instructor_status TEXT DEFAULT 'none' 
CHECK (instructor_status IN ('none', 'pending', 'approved', 'rejected'));

-- Update existing instructors to have 'approved' status
UPDATE profiles 
SET instructor_status = 'approved' 
WHERE is_instructor = true AND instructor_status = 'none';

-- Add is_admin column for admin users
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_instructor_status ON profiles(instructor_status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);

-- Update the handle_new_user function to include instructor_status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, is_instructor, instructor_status, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    -- New users requesting instructor access start as non-instructors with pending status
    CASE 
      WHEN (NEW.raw_user_meta_data->>'is_instructor')::boolean = true THEN false
      ELSE false
    END,
    CASE 
      WHEN (NEW.raw_user_meta_data->>'is_instructor')::boolean = true THEN 'pending'
      ELSE 'none'
    END,
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policy for admins to view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS policy for admins to update any profile
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );
