-- Messaging System Verification Script
-- Run this in Supabase SQL Editor to diagnose messaging issues

-- ============================================================
-- SECTION 1: Check Table Existence
-- ============================================================
SELECT 
    'Tables Check' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'group_chats'
        ) THEN '✓ group_chats exists'
        ELSE '✗ group_chats MISSING'
    END as group_chats_status,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'group_chat_members'
        ) THEN '✓ group_chat_members exists'
        ELSE '✗ group_chat_members MISSING'
    END as group_chat_members_status,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'group_messages'
        ) THEN '✓ group_messages exists'
        ELSE '✗ group_messages MISSING'
    END as group_messages_status;

-- ============================================================
-- SECTION 2: Check Games vs Group Chats
-- ============================================================
SELECT 
    'Games Analysis' as analysis_type,
    COUNT(*) as total_games,
    COUNT(CASE WHEN g.game_date >= CURRENT_DATE THEN 1 END) as future_games,
    COUNT(CASE WHEN g.game_date < CURRENT_DATE THEN 1 END) as past_games
FROM games g;

SELECT 
    'Group Chats Analysis' as analysis_type,
    COUNT(DISTINCT gc.game_id) as games_with_chats,
    COUNT(*) as total_chats
FROM group_chats gc;

-- ============================================================
-- SECTION 3: Find Games WITHOUT Group Chats
-- ============================================================
SELECT 
    'MISSING GROUP CHATS' as issue,
    g.id as game_id,
    g.venue_name,
    g.game_date,
    g.created_at as game_created_at,
    COUNT(r.id) as rsvp_count
FROM games g
LEFT JOIN group_chats gc ON g.id = gc.game_id
LEFT JOIN rsvps r ON g.id = r.game_id
WHERE gc.id IS NULL
  AND g.game_date >= CURRENT_DATE - INTERVAL '7 days'  -- Recent games
GROUP BY g.id, g.venue_name, g.game_date, g.created_at
ORDER BY g.game_date DESC, g.created_at DESC;

-- ============================================================
-- SECTION 4: Check RSVP vs Group Chat Membership Mismatch
-- ============================================================
SELECT 
    'MEMBERSHIP MISMATCHES' as issue,
    g.id as game_id,
    g.venue_name,
    g.game_date,
    gc.id as group_chat_id,
    COUNT(DISTINCT r.user_id) as rsvp_count,
    COUNT(DISTINCT gcm.user_id) as member_count,
    COUNT(DISTINCT r.user_id) - COUNT(DISTINCT gcm.user_id) as missing_members
FROM games g
JOIN group_chats gc ON g.id = gc.game_id
LEFT JOIN rsvps r ON g.id = r.game_id
LEFT JOIN group_chat_members gcm ON gc.id = gcm.group_chat_id AND gcm.user_id = r.user_id
WHERE g.game_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY g.id, g.venue_name, g.game_date, gc.id
HAVING COUNT(DISTINCT r.user_id) != COUNT(DISTINCT gcm.user_id)
ORDER BY g.game_date DESC;

-- ============================================================
-- SECTION 5: Check Messages Count
-- ============================================================
SELECT 
    'Messages Summary' as summary_type,
    gc.game_id,
    g.venue_name,
    g.game_date,
    COUNT(gcm.user_id) as members,
    COUNT(gm.id) as total_messages,
    MAX(gm.created_at) as last_message_time
FROM group_chats gc
JOIN games g ON gc.game_id = g.id
LEFT JOIN group_chat_members gcm ON gc.id = gcm.group_chat_id
LEFT JOIN group_messages gm ON gc.id = gm.group_chat_id
WHERE g.game_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY gc.game_id, g.venue_name, g.game_date, gc.id
ORDER BY g.game_date DESC;

-- ============================================================
-- SECTION 6: Check RLS Policies
-- ============================================================
SELECT 
    'RLS Policies Check' as check_type,
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has USING clause'
        ELSE 'No USING clause'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
        ELSE 'No WITH CHECK clause'
    END as with_check_clause
FROM pg_policies 
WHERE tablename IN ('group_chats', 'group_chat_members', 'group_messages')
ORDER BY tablename, policyname;

-- ============================================================
-- SECTION 7: Check Realtime Publication
-- ============================================================
SELECT 
    'Realtime Check' as check_type,
    pt.pubname as publication,
    pt.schemaname as schema,
    pt.tablename as table_name
FROM pg_publication_tables pt
WHERE pt.pubname = 'supabase_realtime'
  AND pt.tablename IN ('group_messages', 'group_chat_members')
ORDER BY pt.tablename;

-- ============================================================
-- SECTION 8: Recent Activity Check (Last 7 Days)
-- ============================================================
SELECT 
    'Recent Activity' as activity_type,
    DATE(created_at) as date,
    'games' as table_name,
    COUNT(*) as count
FROM games
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
UNION ALL
SELECT 
    'Recent Activity' as activity_type,
    DATE(created_at) as date,
    'group_chats' as table_name,
    COUNT(*) as count
FROM group_chats
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
UNION ALL
SELECT 
    'Recent Activity' as activity_type,
    DATE(created_at) as date,
    'group_messages' as table_name,
    COUNT(*) as count
FROM group_messages
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC, table_name;

-- ============================================================
-- SECTION 9: User-Specific Debug (REPLACE USER_EMAIL)
-- ============================================================
-- Replace 'your-email@example.com' with actual user email to debug specific user
/*
WITH user_games AS (
    SELECT g.*, r.created_at as joined_at
    FROM games g
    JOIN rsvps r ON g.id = r.game_id
    JOIN auth.users u ON r.user_id = u.id
    WHERE u.email = 'your-email@example.com'
      AND g.game_date >= CURRENT_DATE - INTERVAL '7 days'
)
SELECT 
    'User Games Debug' as debug_type,
    ug.id as game_id,
    ug.venue_name,
    ug.game_date,
    ug.joined_at,
    CASE WHEN gc.id IS NOT NULL THEN '✓ Has chat' ELSE '✗ No chat' END as chat_status,
    CASE WHEN gcm.id IS NOT NULL THEN '✓ Is member' ELSE '✗ Not member' END as membership_status,
    COUNT(gm.id) as messages_count
FROM user_games ug
LEFT JOIN group_chats gc ON ug.id = gc.game_id
LEFT JOIN group_chat_members gcm ON gc.id = gcm.group_chat_id 
    AND gcm.user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com')
LEFT JOIN group_messages gm ON gc.id = gm.group_chat_id
GROUP BY ug.id, ug.venue_name, ug.game_date, ug.joined_at, gc.id, gcm.id
ORDER BY ug.game_date DESC;
*/

-- ============================================================
-- SUMMARY
-- ============================================================
SELECT 
    '=== SUMMARY ===' as section,
    (SELECT COUNT(*) FROM games WHERE game_date >= CURRENT_DATE) as active_games,
    (SELECT COUNT(*) FROM group_chats) as total_group_chats,
    (SELECT COUNT(*) FROM group_messages WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as messages_last_7_days,
    (SELECT COUNT(*) FROM games g LEFT JOIN group_chats gc ON g.id = gc.game_id WHERE gc.id IS NULL AND g.game_date >= CURRENT_DATE) as games_missing_chats;

