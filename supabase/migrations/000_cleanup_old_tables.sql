-- =====================================================
-- CLEANUP SCRIPT: Drop all existing tables
-- Run this FIRST to wipe old data, then run 001_initial_schema.sql
-- =====================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS get_booking_count(UUID) CASCADE;

-- Drop all existing tables (add your old table names here)
-- Common tables from old project:
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS rsvps CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS time_slots CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS group_chat_members CASCADE;
DROP TABLE IF EXISTS group_messages CASCADE;
DROP TABLE IF EXISTS group_chats CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- If you have other tables, add them here:
-- DROP TABLE IF EXISTS your_old_table_name CASCADE;

-- Verify cleanup
DO $$
BEGIN
  RAISE NOTICE 'Cleanup complete! Now run 001_initial_schema.sql';
END $$;
