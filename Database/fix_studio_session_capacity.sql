-- Fix Studio Session Capacity
-- Updates all web-created sessions (those with instructor_id) to have 15 spots instead of 4

-- Update all studio sessions to have 15 max players
UPDATE games 
SET max_players = 15
WHERE instructor_id IS NOT NULL
  AND max_players != 15;

-- Verify the update
SELECT 
    id,
    custom_title,
    venue_name,
    instructor_id,
    max_players,
    game_date,
    start_time
FROM games
WHERE instructor_id IS NOT NULL
ORDER BY game_date, start_time;
