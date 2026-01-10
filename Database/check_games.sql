-- Check what games exist in the database
-- This helps debug why mobile app isn't showing games

SELECT 
    id,
    created_by,
    instructor_id,
    venue_name,
    game_date,
    start_time,
    sport,
    max_players,
    cost_cents,
    custom_title,
    status,
    created_at
FROM games
WHERE game_date >= CURRENT_DATE
ORDER BY game_date, start_time;

-- Check if there are ANY games at all
SELECT COUNT(*) as total_games FROM games;

-- Check for games created today
SELECT COUNT(*) as games_created_today 
FROM games 
WHERE DATE(created_at) = CURRENT_DATE;
