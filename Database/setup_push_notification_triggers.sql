-- Alternative to Webhooks: Database Triggers for Push Notifications
-- Use this ONLY if webhooks don't work in your Supabase project

-- NOTE: This approach uses database triggers to call the Edge Function via HTTP
-- This is an alternative to using Supabase Webhooks (which are preferred)

-- =====================================================
-- OPTION 1: Use Supabase pg_net for HTTP requests
-- =====================================================

-- First, ensure pg_net extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to trigger push notification via Edge Function
CREATE OR REPLACE FUNCTION trigger_push_notification()
RETURNS TRIGGER AS $$
DECLARE
    function_url TEXT;
    request_id BIGINT;
BEGIN
    -- Construct Edge Function URL
    function_url := 'https://xkesrtakogrsrurvsmnp.supabase.co/functions/v1/send-push-notification';
    
    -- Make HTTP POST request to Edge Function
    SELECT net.http_post(
        url := function_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
            'type', 'INSERT',
            'table', TG_TABLE_NAME,
            'record', row_to_json(NEW)
        )
    ) INTO request_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for group_messages
DROP TRIGGER IF EXISTS trigger_push_notification_group_messages ON group_messages;
CREATE TRIGGER trigger_push_notification_group_messages
    AFTER INSERT ON group_messages
    FOR EACH ROW
    EXECUTE FUNCTION trigger_push_notification();

-- Trigger for messages
DROP TRIGGER IF EXISTS trigger_push_notification_messages ON messages;
CREATE TRIGGER trigger_push_notification_messages
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION trigger_push_notification();

-- =====================================================
-- OPTION 2: Simplified approach using a notification queue
-- (If pg_net doesn't work)
-- =====================================================

-- Create a pending_notifications table
CREATE TABLE IF NOT EXISTS pending_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    record_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Index for processing queue
CREATE INDEX IF NOT EXISTS idx_pending_notifications_unprocessed 
    ON pending_notifications(created_at) 
    WHERE processed = false;

-- Function to queue notification
CREATE OR REPLACE FUNCTION queue_push_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO pending_notifications (table_name, record_id, record_data)
    VALUES (TG_TABLE_NAME, NEW.id, row_to_json(NEW)::jsonb);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers using queue approach
DROP TRIGGER IF EXISTS queue_push_notification_group_messages ON group_messages;
CREATE TRIGGER queue_push_notification_group_messages
    AFTER INSERT ON group_messages
    FOR EACH ROW
    EXECUTE FUNCTION queue_push_notification();

DROP TRIGGER IF EXISTS queue_push_notification_messages ON messages;
CREATE TRIGGER queue_push_notification_messages
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION queue_push_notification();

-- NOTE: With the queue approach, you'll need a separate worker/cron job to:
-- 1. Poll pending_notifications table for unprocessed records
-- 2. Call the Edge Function for each record
-- 3. Mark as processed

-- Example cron job (create in Supabase Dashboard → Database → Cron Jobs)
/*
SELECT cron.schedule(
    'process-pending-notifications',
    '*/1 * * * *', -- Every minute
    $$
    -- Call Edge Function to process pending notifications
    -- This would need to be implemented as an Edge Function
    SELECT net.http_post(
        url := 'https://xkesrtakogrsrurvsmnp.supabase.co/functions/v1/process-pending-notifications',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        )
    );
    $$
);
*/

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check if triggers are created
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%push_notification%'
ORDER BY event_object_table;

-- Test the queue (if using Option 2)
-- This should show any pending notifications
SELECT 
    id,
    table_name,
    record_id,
    processed,
    created_at
FROM pending_notifications
WHERE processed = false
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- CLEANUP (if needed)
-- =====================================================

-- To remove all triggers and switch back to webhooks:
/*
DROP TRIGGER IF EXISTS trigger_push_notification_group_messages ON group_messages;
DROP TRIGGER IF EXISTS trigger_push_notification_messages ON messages;
DROP TRIGGER IF EXISTS queue_push_notification_group_messages ON group_messages;
DROP TRIGGER IF EXISTS queue_push_notification_messages ON messages;
DROP FUNCTION IF EXISTS trigger_push_notification();
DROP FUNCTION IF EXISTS queue_push_notification();
DROP TABLE IF EXISTS pending_notifications;
*/

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================

/*
WHICH OPTION TO USE:

1. WEBHOOKS (Recommended - not in this file):
   - Configure in Supabase Dashboard → Database → Webhooks
   - Most reliable and officially supported
   - Easy to manage via UI
   - Use the instructions in PUSH_NOTIFICATIONS_SETUP.md

2. OPTION 1 (pg_net triggers):
   - Use if webhooks interface isn't available in your plan
   - Requires pg_net extension
   - Calls Edge Function directly from database
   - Near real-time delivery

3. OPTION 2 (Queue):
   - Use as last resort if pg_net doesn't work
   - Requires additional cron job or worker
   - Slight delay in notification delivery
   - More complex to maintain

START WITH WEBHOOKS IN THE DASHBOARD!
Only use this file if webhooks are not working.
*/

