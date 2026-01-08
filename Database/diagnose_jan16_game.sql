-- Diagnostic query to find the January 16, 11:00 AM game
-- Run this in your Supabase SQL Editor

-- Find all games around January 16, 2026
SELECT 
    id,
    sport,
    game_date,
    start_time,
    venue_name,
    address,
    status,
    instructor_id,
    created_by,
    max_players,
    description,
    created_at
FROM games
WHERE game_date >= '2026-01-15' 
  AND game_date <= '2026-01-17'
ORDER BY game_date, start_time;

-- Also check for games with time around 11:00 AM
SELECT 
    id,
    sport,
    game_date,
    start_time,
    venue_name,
    status,
    instructor_id,
    created_by,
    description
FROM games
WHERE start_time >= '10:30:00' 
  AND start_time <= '11:30:00'
  AND game_date >= '2026-01-01'
ORDER BY game_date, start_time;
