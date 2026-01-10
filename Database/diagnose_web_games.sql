-- =====================================================
-- Diagnose Web-Created Games Visibility
-- =====================================================

-- Check all games created today or recently
SELECT 
    id,
    created_by,
    instructor_id,
    sport,
    venue_name,
    custom_title,
    game_date,
    start_time,
    status,
    is_private,
    created_at,
    CASE 
        WHEN instructor_id IS NOT NULL THEN 'Web-created'
        ELSE 'User-created'
    END as source
FROM games
WHERE game_date >= CURRENT_DATE
ORDER BY created_at DESC
LIMIT 20;

-- Check RSVP counts for recent games
SELECT 
    g.id as game_id,
    g.custom_title,
    g.game_date,
    g.start_time,
    g.instructor_id,
    g.status,
    COUNT(r.id) as rsvp_count
FROM games g
LEFT JOIN rsvps r ON g.id = r.game_id
WHERE g.game_date >= CURRENT_DATE
GROUP BY g.id, g.custom_title, g.game_date, g.start_time, g.instructor_id, g.status
ORDER BY g.game_date, g.start_time;

-- Check if there are any games with status='booked' that don't have instructor_id
SELECT 
    id,
    venue_name,
    custom_title,
    game_date,
    start_time,
    instructor_id,
    status
FROM games
WHERE status = 'booked' AND instructor_id IS NULL;

-- Check column existence
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'games'
AND column_name IN ('instructor_id', 'status', 'sport')
ORDER BY column_name;
