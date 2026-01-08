-- Fix the January 16 game to be yoga instead of pickleball
-- Run this in your Supabase SQL Editor

UPDATE games
SET sport = 'yoga'
WHERE id = 'a8dc47cf-d637-4968-9a43-486e24fa7883';

-- Verify the fix
SELECT 
    id,
    sport,
    game_date,
    start_time,
    venue_name,
    status,
    instructor_id
FROM games
WHERE id = 'a8dc47cf-d637-4968-9a43-486e24fa7883';
