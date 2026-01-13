-- Backfill profiles for any existing users who don't have one
-- This handles users created before the auto-create trigger was added

INSERT INTO public.profiles (id, email, first_name, last_name, is_instructor)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'first_name', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'last_name', ''),
  COALESCE((u.raw_user_meta_data->>'is_instructor')::boolean, false)
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;
