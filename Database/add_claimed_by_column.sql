-- =====================================================
-- ADD CLAIMED_BY COLUMN TO GAMES TABLE
-- =====================================================
-- This enables instructors to "claim" available studio sessions
-- When claimed_by IS NULL, the session is available on the marketplace
-- When claimed_by has a value, the session is claimed by that instructor

-- Add claimed_by column to track which instructor claimed the session
ALTER TABLE games ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add claimed_at timestamp to track when the session was claimed
ALTER TABLE games ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- Create index for efficient filtering of unclaimed sessions
CREATE INDEX IF NOT EXISTS idx_games_claimed_by ON games(claimed_by) WHERE claimed_by IS NULL;

-- Create index for looking up sessions claimed by a specific instructor
CREATE INDEX IF NOT EXISTS idx_games_claimed_by_user ON games(claimed_by) WHERE claimed_by IS NOT NULL;

-- =====================================================
-- COMMENTS
-- =====================================================
-- IMPORTANT DISTINCTION:
-- - created_by: The studio owner who posted the available time slot
-- - claimed_by: The instructor who claimed/booked the slot to host their class
--
-- WORKFLOW:
-- 1. Studio owner creates session (created_by = owner, claimed_by = NULL)
-- 2. Session appears on marketplace (where claimed_by IS NULL)
-- 3. Instructor claims session (claimed_by = instructor_id, claimed_at = NOW())
-- 4. Session removed from marketplace
-- 5. Instructor gets shareable link for their students
--
-- QUERIES:
-- Available sessions (marketplace): WHERE claimed_by IS NULL
-- My claimed sessions: WHERE claimed_by = instructor_id
-- My posted sessions: WHERE created_by = studio_owner_id

