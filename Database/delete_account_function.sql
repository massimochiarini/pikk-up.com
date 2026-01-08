-- =====================================================
-- Account Deletion Function
-- This function allows users to delete their own accounts
-- =====================================================

-- Function to delete the current user's account
-- SECURITY DEFINER allows it to execute with elevated privileges
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void AS $$
DECLARE
    user_id_to_delete UUID;
BEGIN
    -- Get the current user's ID
    user_id_to_delete := auth.uid();
    
    -- Ensure user is authenticated
    IF user_id_to_delete IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Delete the user from auth.users
    -- This will cascade delete all related data due to ON DELETE CASCADE constraints
    DELETE FROM auth.users WHERE id = user_id_to_delete;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user() TO authenticated;

