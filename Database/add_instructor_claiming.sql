-- =====================================================
-- Add Instructor Claiming to Games Table
-- Web App Only - Merchant/Instructor Features
-- =====================================================

-- Add instructor_id column to track who claimed/is teaching the session
ALTER TABLE games ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add status column to track if session is available or booked
-- Values: 'available' (default), 'booked' (instructor claimed)
ALTER TABLE games ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'available';

-- Create index for instructor lookups
CREATE INDEX IF NOT EXISTS idx_games_instructor_id ON games(instructor_id) WHERE instructor_id IS NOT NULL;

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);

-- Add constraint to ensure status is valid
ALTER TABLE games ADD CONSTRAINT check_game_status 
    CHECK (status IN ('available', 'booked'));

-- Update RLS policies to allow instructors to update sessions they claim
-- This policy allows instructors to claim sessions (update instructor_id and status)
DROP POLICY IF EXISTS "Instructors can claim available sessions" ON games;
CREATE POLICY "Instructors can claim available sessions" ON games
    FOR UPDATE USING (
        -- Either it's their own game (creator)
        created_by = auth.uid()
        -- Or they're claiming an available session
        OR (status = 'available' AND instructor_id IS NULL)
        -- Or they're the instructor modifying their claimed session
        OR instructor_id = auth.uid()
    );

-- Note: The existing "Users can update their own games" policy needs to be replaced
-- Let's drop it and use the new one above
DROP POLICY IF EXISTS "Users can update their own games" ON games;

-- Recreate a policy for creators only
CREATE POLICY "Creators can update their own games" ON games
    FOR UPDATE USING (created_by = auth.uid());

-- Function to claim a session (ensures atomicity and validation)
CREATE OR REPLACE FUNCTION claim_session(
    p_game_id UUID,
    p_instructor_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_current_instructor UUID;
    v_current_status TEXT;
    v_result JSON;
BEGIN
    -- Get current session state
    SELECT instructor_id, status INTO v_current_instructor, v_current_status
    FROM games
    WHERE id = p_game_id;
    
    -- Check if session exists
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Session not found'
        );
    END IF;
    
    -- Check if already booked
    IF v_current_status = 'booked' AND v_current_instructor IS NOT NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Session already booked by another instructor'
        );
    END IF;
    
    -- Claim the session
    UPDATE games
    SET 
        instructor_id = p_instructor_id,
        status = 'booked'
    WHERE id = p_game_id
    AND (instructor_id IS NULL OR instructor_id = p_instructor_id)
    AND status = 'available';
    
    -- Check if update was successful
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to claim session - it may have been claimed by someone else'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Session claimed successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unclaim/release a session
CREATE OR REPLACE FUNCTION unclaim_session(
    p_game_id UUID,
    p_instructor_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_current_instructor UUID;
BEGIN
    -- Get current instructor
    SELECT instructor_id INTO v_current_instructor
    FROM games
    WHERE id = p_game_id;
    
    -- Check if session exists
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Session not found'
        );
    END IF;
    
    -- Check if the user is the instructor
    IF v_current_instructor != p_instructor_id THEN
        RETURN json_build_object(
            'success', false,
            'error', 'You can only unclaim sessions you have claimed'
        );
    END IF;
    
    -- Release the session
    UPDATE games
    SET 
        instructor_id = NULL,
        status = 'available'
    WHERE id = p_game_id
    AND instructor_id = p_instructor_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Session released successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION claim_session(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION unclaim_session(UUID, UUID) TO authenticated;

