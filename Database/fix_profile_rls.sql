-- =====================================================
-- FIX FOR: "new row violates row-level security policy"
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- This function bypasses RLS to ensure profiles exist
-- It's called from the app when updating profiles
CREATE OR REPLACE FUNCTION public.ensure_profile_exists(
    p_user_id UUID,
    p_first_name TEXT DEFAULT '',
    p_last_name TEXT DEFAULT ''
)
RETURNS VOID AS $$
BEGIN
    -- Insert the profile if it doesn't exist, do nothing if it already exists
    INSERT INTO public.profiles (id, first_name, last_name, created_at)
    VALUES (p_user_id, p_first_name, p_last_name, NOW())
    ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also ensure the trigger exists for future signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'first_name', ''),
        COALESCE(new.raw_user_meta_data->>'last_name', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.ensure_profile_exists TO authenticated;

-- OPTIONAL: Fix existing users who signed up but don't have profiles
-- This creates profiles for any auth users missing one
INSERT INTO public.profiles (id, first_name, last_name, created_at)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'first_name', ''),
    COALESCE(u.raw_user_meta_data->>'last_name', ''),
    NOW()
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

