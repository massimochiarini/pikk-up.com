-- Fix existing games to use 'yoga' instead of 'pickleball'
-- This ensures all games show up in the Pick Up Yoga mobile app

-- Update all games to use 'yoga' as the sport
UPDATE games
SET sport = 'yoga'
WHERE sport = 'pickleball' OR sport IS NULL OR sport != 'yoga';

-- Verify the update
SELECT 
    COUNT(*) as total_games,
    COUNT(CASE WHEN sport = 'yoga' THEN 1 END) as yoga_games,
    COUNT(CASE WHEN sport != 'yoga' THEN 1 END) as other_sport_games
FROM games;

-- Show all upcoming games with their sport
SELECT 
    id,
    venue_name,
    game_date,
    start_time,
    sport,
    instructor_id,
    custom_title
FROM games
WHERE game_date >= CURRENT_DATE
ORDER BY game_date, start_time;
