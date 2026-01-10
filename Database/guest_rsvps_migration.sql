-- =====================================================
-- GUEST RSVPS MIGRATION
-- Support for public booking links without authentication
-- =====================================================

-- Step 1: Make user_id nullable to support guest RSVPs
ALTER TABLE rsvps ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Add guest information columns
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS guest_first_name TEXT;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS guest_last_name TEXT;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS guest_phone TEXT;

-- Step 3: Update unique constraint to handle both user and guest RSVPs
-- Drop old constraint
ALTER TABLE rsvps DROP CONSTRAINT IF EXISTS unique_game_user;

-- Add new constraint that works for both users and guests
-- For logged-in users: unique on (game_id, user_id) where user_id is not null
-- For guests: unique on (game_id, guest_email) where guest_email is not null
CREATE UNIQUE INDEX IF NOT EXISTS unique_game_user_rsvp 
ON rsvps(game_id, user_id) 
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unique_game_guest_rsvp 
ON rsvps(game_id, guest_email) 
WHERE guest_email IS NOT NULL;

-- Step 4: Add check constraint to ensure either user_id or guest info is provided
ALTER TABLE rsvps DROP CONSTRAINT IF EXISTS rsvp_user_or_guest;
ALTER TABLE rsvps ADD CONSTRAINT rsvp_user_or_guest 
CHECK (
  (user_id IS NOT NULL) OR 
  (guest_first_name IS NOT NULL AND guest_last_name IS NOT NULL AND guest_email IS NOT NULL)
);

-- Step 5: Update RLS policies to allow public guest RSVPs

-- Update the insert policy to allow guest RSVPs (no auth required for guests)
DROP POLICY IF EXISTS "Users can create their own rsvps" ON rsvps;
CREATE POLICY "Users and guests can create rsvps" ON rsvps
    FOR INSERT WITH CHECK (
      -- Either it's a logged-in user creating their own RSVP
      (user_id = auth.uid()) OR 
      -- Or it's a guest RSVP (user_id is null and guest info is provided)
      (user_id IS NULL AND guest_email IS NOT NULL)
    );

-- Update delete policy to only allow users to delete their own RSVPs
-- Guests cannot delete their RSVPs through the public interface
DROP POLICY IF EXISTS "Users can delete their own rsvps" ON rsvps;
CREATE POLICY "Users can delete their own rsvps" ON rsvps
    FOR DELETE USING (user_id = auth.uid());

-- The select policy remains unchanged - everyone can view all RSVPs

-- Step 6: Add index for guest email lookups
CREATE INDEX IF NOT EXISTS idx_rsvps_guest_email ON rsvps(guest_email) WHERE guest_email IS NOT NULL;

-- Step 7: Update the rsvps user_id index to handle nulls
DROP INDEX IF EXISTS idx_rsvps_user_id;
CREATE INDEX IF NOT EXISTS idx_rsvps_user_id ON rsvps(user_id) WHERE user_id IS NOT NULL;

-- =====================================================
-- Notes:
-- - Guest RSVPs will have user_id = NULL
-- - Guest RSVPs require first_name, last_name, and email
-- - Phone is optional for guests
-- - Guests are identified by email for duplicate prevention
-- - RSVPs (both user and guest) will appear in the app and web interface
-- =====================================================
