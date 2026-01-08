-- Fix Missing Group Chats
-- This script creates group chats for games that don't have them
-- and adds all RSVP'd users to those chats

-- Step 1: Create group chats for games without them
INSERT INTO group_chats (game_id, name, created_at)
SELECT 
    g.id as game_id,
    g.venue_name as name,
    NOW() as created_at
FROM games g
LEFT JOIN group_chats gc ON g.id = gc.game_id
WHERE gc.id IS NULL
  AND g.game_date >= CURRENT_DATE; -- Only for future/current games

-- Step 2: Add all RSVP'd users to their respective group chats
INSERT INTO group_chat_members (group_chat_id, user_id, joined_at)
SELECT DISTINCT
    gc.id as group_chat_id,
    r.user_id,
    NOW() as joined_at
FROM rsvps r
JOIN group_chats gc ON r.game_id = gc.game_id
LEFT JOIN group_chat_members gcm ON gcm.group_chat_id = gc.id AND gcm.user_id = r.user_id
WHERE gcm.id IS NULL -- Only add if not already a member
  AND EXISTS (
    SELECT 1 FROM games g 
    WHERE g.id = r.game_id 
    AND g.game_date >= CURRENT_DATE
  );

-- Verify the fix
SELECT 
    g.id as game_id,
    g.venue_name,
    g.game_date,
    gc.id as group_chat_id,
    COUNT(gcm.user_id) as members_count,
    COUNT(r.user_id) as rsvp_count
FROM games g
LEFT JOIN group_chats gc ON g.id = gc.game_id
LEFT JOIN group_chat_members gcm ON gc.id = gcm.group_chat_id
LEFT JOIN rsvps r ON g.id = r.game_id
WHERE g.game_date >= CURRENT_DATE
GROUP BY g.id, g.venue_name, g.game_date, gc.id
ORDER BY g.game_date;

