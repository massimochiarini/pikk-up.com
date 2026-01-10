-- =====================================================
-- QUICK START: Run this script in Supabase SQL Editor
-- This enables public booking links for your app
-- =====================================================

-- Step 1: Make user_id nullable to support guest RSVPs
ALTER TABLE rsvps ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Add guest information columns
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS guest_first_name TEXT;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS guest_last_name TEXT;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS guest_phone TEXT;

-- Step 3: Update unique constraint to handle both user and guest RSVPs
ALTER TABLE rsvps DROP CONSTRAINT IF EXISTS unique_game_user;

CREATE UNIQUE INDEX IF NOT EXISTS unique_game_user_rsvp 
ON rsvps(game_id, user_id) 
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unique_game_guest_rsvp 
ON rsvps(game_id, guest_email) 
WHERE guest_email IS NOT NULL;

-- Step 4: Add check constraint
ALTER TABLE rsvps DROP CONSTRAINT IF EXISTS rsvp_user_or_guest;
ALTER TABLE rsvps ADD CONSTRAINT rsvp_user_or_guest 
CHECK (
  (user_id IS NOT NULL) OR 
  (guest_first_name IS NOT NULL AND guest_last_name IS NOT NULL AND guest_email IS NOT NULL)
);

-- Step 5: Update RLS policies
DROP POLICY IF EXISTS "Users can create their own rsvps" ON rsvps;
CREATE POLICY "Users and guests can create rsvps" ON rsvps
    FOR INSERT WITH CHECK (
      (user_id = auth.uid()) OR 
      (user_id IS NULL AND guest_email IS NOT NULL)
    );

DROP POLICY IF EXISTS "Users can delete their own rsvps" ON rsvps;
CREATE POLICY "Users can delete their own rsvps" ON rsvps
    FOR DELETE USING (user_id = auth.uid());

-- Step 6: Add indexes
CREATE INDEX IF NOT EXISTS idx_rsvps_guest_email ON rsvps(guest_email) WHERE guest_email IS NOT NULL;

DROP INDEX IF EXISTS idx_rsvps_user_id;
CREATE INDEX IF NOT EXISTS idx_rsvps_user_id ON rsvps(user_id) WHERE user_id IS NOT NULL;

-- Done! Your app now supports public booking links
SELECT 'Migration completed successfully! Public booking links are now enabled.' as status;
