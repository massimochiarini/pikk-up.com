-- Push Notification Diagnostic Script
-- Run this in Supabase SQL Editor to diagnose push notification issues

-- ============================================================
-- SECTION 1: Check Device Tokens
-- ============================================================
SELECT 
    '=== DEVICE TOKENS ===' as section,
    COUNT(*) as total_tokens,
    COUNT(DISTINCT user_id) as unique_users,
    MAX(created_at) as latest_registration
FROM device_tokens;

-- Show recent device tokens
SELECT 
    'Recent Device Tokens' as check_type,
    dt.user_id,
    p.first_name || ' ' || p.last_name as user_name,
    dt.platform,
    dt.app_version,
    LEFT(dt.token, 20) || '...' as token_preview,
    dt.created_at,
    dt.updated_at,
    AGE(NOW(), dt.updated_at) as token_age
FROM device_tokens dt
LEFT JOIN profiles p ON p.id = dt.user_id
ORDER BY dt.created_at DESC
LIMIT 10;

-- ============================================================
-- SECTION 2: Check RLS Policies on device_tokens
-- ============================================================
SELECT 
    '=== RLS POLICIES ===' as section,
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has USING clause'
        ELSE 'No USING clause'
    END as using_clause
FROM pg_policies 
WHERE tablename = 'device_tokens'
ORDER BY policyname;

-- ============================================================
-- SECTION 3: Check Database Functions
-- ============================================================
SELECT 
    '=== PUSH NOTIFICATION FUNCTIONS ===' as section,
    routine_name,
    CASE 
        WHEN routine_name = 'get_push_tokens_for_conversation' THEN '✓ Exists'
        WHEN routine_name = 'get_push_tokens_for_group_chat' THEN '✓ Exists'
        ELSE 'Unknown'
    END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_push_tokens_for_conversation', 'get_push_tokens_for_group_chat');

-- Verify both functions exist
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name = 'get_push_tokens_for_conversation'
        ) THEN '✓ get_push_tokens_for_conversation exists'
        ELSE '✗ get_push_tokens_for_conversation MISSING'
    END as conversation_function,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name = 'get_push_tokens_for_group_chat'
        ) THEN '✓ get_push_tokens_for_group_chat exists'
        ELSE '✗ get_push_tokens_for_group_chat MISSING'
    END as group_chat_function;

-- ============================================================
-- SECTION 4: Test Push Token Functions
-- ============================================================
-- Test get_push_tokens_for_group_chat function
WITH recent_group_chat AS (
    SELECT id FROM group_chats ORDER BY created_at DESC LIMIT 1
),
recent_user AS (
    SELECT user_id FROM group_chat_members 
    WHERE group_chat_id = (SELECT id FROM recent_group_chat)
    LIMIT 1
)
SELECT 
    '=== TEST GROUP CHAT FUNCTION ===' as section,
    (SELECT id FROM recent_group_chat) as test_group_chat_id,
    (SELECT user_id FROM recent_user) as exclude_user_id,
    COUNT(*) as tokens_found
FROM recent_group_chat
CROSS JOIN recent_user
LEFT JOIN LATERAL (
    SELECT * FROM get_push_tokens_for_group_chat(
        (SELECT id FROM recent_group_chat),
        (SELECT user_id FROM recent_user)
    )
) tokens ON true;

-- ============================================================
-- SECTION 5: Check Recent Messages (Should Trigger Notifications)
-- ============================================================
SELECT 
    '=== RECENT GROUP MESSAGES ===' as section,
    gm.id,
    gm.group_chat_id,
    gc.name as chat_name,
    gm.sender_id,
    p.first_name || ' ' || p.last_name as sender_name,
    LEFT(gm.content, 50) as message_preview,
    gm.created_at,
    COUNT(gcm.user_id) - 1 as should_notify_count  -- -1 to exclude sender
FROM group_messages gm
JOIN group_chats gc ON gm.group_chat_id = gc.id
LEFT JOIN profiles p ON p.id = gm.sender_id
LEFT JOIN group_chat_members gcm ON gcm.group_chat_id = gm.group_chat_id AND gcm.user_id != gm.sender_id
WHERE gm.created_at >= NOW() - INTERVAL '1 hour'
GROUP BY gm.id, gm.group_chat_id, gc.name, gm.sender_id, p.first_name, p.last_name, gm.content, gm.created_at
ORDER BY gm.created_at DESC
LIMIT 5;

-- Show which users should have received notifications
WITH recent_message AS (
    SELECT id, group_chat_id, sender_id, content, created_at
    FROM group_messages
    WHERE created_at >= NOW() - INTERVAL '1 hour'
    ORDER BY created_at DESC
    LIMIT 1
)
SELECT 
    '=== WHO SHOULD GET NOTIFIED ===' as section,
    gcm.user_id,
    p.first_name || ' ' || p.last_name as recipient_name,
    CASE 
        WHEN dt.token IS NOT NULL THEN '✓ Has device token'
        ELSE '✗ No device token'
    END as token_status,
    rm.content as message_content,
    rm.created_at as message_time
FROM recent_message rm
JOIN group_chat_members gcm ON gcm.group_chat_id = rm.group_chat_id
LEFT JOIN profiles p ON p.id = gcm.user_id
LEFT JOIN device_tokens dt ON dt.user_id = gcm.user_id
WHERE gcm.user_id != rm.sender_id;  -- Don't notify sender

-- ============================================================
-- SECTION 6: Check for Database Triggers
-- ============================================================
SELECT 
    '=== DATABASE TRIGGERS ===' as section,
    trigger_name,
    event_object_table as table_name,
    action_timing,
    event_manipulation as event
FROM information_schema.triggers
WHERE trigger_name LIKE '%push%' OR trigger_name LIKE '%notification%'
ORDER BY event_object_table;

-- ============================================================
-- SECTION 7: Check Table Structure
-- ============================================================
SELECT 
    '=== DEVICE_TOKENS TABLE STRUCTURE ===' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'device_tokens'
ORDER BY ordinal_position;

-- ============================================================
-- SECTION 8: Sample Data for Testing
-- ============================================================
-- Show users with AND without device tokens
SELECT 
    '=== USERS BY TOKEN STATUS ===' as section,
    p.id,
    p.first_name || ' ' || p.last_name as user_name,
    CASE 
        WHEN dt.token IS NOT NULL THEN '✓ Has token'
        ELSE '✗ No token'
    END as status,
    dt.platform,
    dt.created_at as token_registered_at
FROM profiles p
LEFT JOIN device_tokens dt ON dt.user_id = p.id
WHERE p.created_at >= NOW() - INTERVAL '30 days'  -- Recent users only
ORDER BY dt.created_at DESC NULLS LAST
LIMIT 20;

-- ============================================================
-- SECTION 9: Diagnostic Summary
-- ============================================================
SELECT 
    '=== DIAGNOSTIC SUMMARY ===' as section,
    (SELECT COUNT(*) FROM device_tokens) as total_device_tokens,
    (SELECT COUNT(DISTINCT user_id) FROM device_tokens) as users_with_tokens,
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM group_messages WHERE created_at >= NOW() - INTERVAL '1 hour') as messages_last_hour,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_push_tokens_for_conversation')
        AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_push_tokens_for_group_chat')
        THEN '✓ Functions exist'
        ELSE '✗ Functions missing'
    END as database_functions_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name LIKE '%push%')
        THEN '⚠️  Database triggers found (webhooks may not be configured)'
        ELSE '✓ No triggers (using webhooks)'
    END as trigger_status;

-- ============================================================
-- SECTION 10: Common Issues
-- ============================================================
-- Check for users who sent messages but have no device token
WITH messageSenders AS (
    SELECT DISTINCT sender_id
    FROM group_messages
    WHERE created_at >= NOW() - INTERVAL '7 days'
)
SELECT 
    '=== USERS WHO MESSAGE BUT HAVE NO TOKEN ===' as issue,
    ms.sender_id,
    p.first_name || ' ' || p.last_name as user_name,
    p.created_at as user_joined,
    'These users are active but cannot receive notifications' as note
FROM messageSenders ms
LEFT JOIN profiles p ON p.id = ms.sender_id
LEFT JOIN device_tokens dt ON dt.user_id = ms.sender_id
WHERE dt.token IS NULL;

-- Check for very old tokens that might be stale
SELECT 
    '=== POTENTIALLY STALE TOKENS ===' as issue,
    dt.user_id,
    p.first_name || ' ' || p.last_name as user_name,
    dt.platform,
    dt.updated_at,
    AGE(NOW(), dt.updated_at) as token_age,
    'Token older than 30 days - may be invalid' as note
FROM device_tokens dt
LEFT JOIN profiles p ON p.id = dt.user_id
WHERE dt.updated_at < NOW() - INTERVAL '30 days'
ORDER BY dt.updated_at;

-- ============================================================
-- ACTION ITEMS BASED ON RESULTS
-- ============================================================
/*
After running this diagnostic, check the following:

1. SECTION 1: Do you have device tokens registered?
   - If NO tokens: Users haven't granted permission or app not registering tokens
   - If NO recent tokens: App may not be running on latest version

2. SECTION 3: Do both functions exist?
   - If MISSING: Run schema.sql Phase 14 functions
   - These are needed for Edge Function to query tokens

3. SECTION 5: Were recent messages sent?
   - If YES but no notifications: Check webhooks or Edge Function
   - If NO messages: No triggers to test yet

4. SECTION 6: Are there database triggers?
   - If YES: You're using triggers instead of webhooks (less ideal)
   - If NO: Should be using webhooks in Supabase Dashboard

5. SECTION 9: Summary
   - Check all status indicators
   - Missing functions = database setup incomplete
   - No tokens = app setup incomplete
   - Triggers found = webhook setup incomplete

6. SECTION 10: Common Issues
   - Users without tokens need to update app and grant permissions
   - Stale tokens should be cleaned up or refreshed

NEXT STEPS:
1. If functions missing: Run schema.sql
2. If no tokens: Follow PUSH_NOTIFICATIONS_SETUP.md Part 2 (Xcode)
3. If no webhooks: Follow PUSH_NOTIFICATIONS_SETUP.md Part 4 (Webhooks)
4. If everything looks good: Check Edge Function logs in Supabase
*/

