-- =====================================================
-- FIX: Ensure instructors can see all RSVPs (both user and guest)
-- Run this in Supabase SQL Editor
-- =====================================================

-- Drop and recreate the SELECT policy to ensure it allows viewing all RSVPs
DROP POLICY IF EXISTS "Users can view all rsvps" ON rsvps;
DROP POLICY IF EXISTS "Anyone can view rsvps" ON rsvps;

-- Allow anyone (authenticated or not) to view all RSVPs
-- This is critical for:
-- 1. Instructors viewing attendee counts on their classes
-- 2. Public booking page showing accurate attendance
-- 3. Users seeing who's attending a class
CREATE POLICY "Anyone can view all rsvps" ON rsvps
    FOR SELECT USING (true);

-- Verify the fix by checking RSVP count
SELECT 'Fix completed! All RSVPs are now visible.' as status;
SELECT 
    'Total RSVPs in database: ' || COUNT(*)::text as rsvp_count,
    'Guest RSVPs: ' || COUNT(*) FILTER (WHERE user_id IS NULL)::text as guest_count,
    'User RSVPs: ' || COUNT(*) FILTER (WHERE user_id IS NOT NULL)::text as user_count
FROM rsvps;
