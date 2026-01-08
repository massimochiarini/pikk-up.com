-- Fix Messaging / DM Issues
-- Run this in Supabase SQL Editor to ensure messaging works properly

-- =====================================================
-- Check if tables exist
-- =====================================================

DO $$ 
BEGIN
    -- Check conversations table
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversations') THEN
        RAISE NOTICE 'Creating conversations table...';
        
        CREATE TABLE conversations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            participant_1 UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            participant_2 UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            context_type TEXT,
            context_id UUID,
            last_message_at TIMESTAMPTZ,
            last_message_preview TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            CONSTRAINT different_participants CHECK (participant_1 != participant_2)
        );
        
        CREATE INDEX idx_conversations_participant_1 ON conversations(participant_1);
        CREATE INDEX idx_conversations_participant_2 ON conversations(participant_2);
        CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
        CREATE UNIQUE INDEX idx_conversations_unique_pair 
            ON conversations(LEAST(participant_1, participant_2), GREATEST(participant_1, participant_2));
    END IF;
    
    -- Check messages table
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
        RAISE NOTICE 'Creating messages table...';
        
        CREATE TABLE messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
            sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            content TEXT NOT NULL,
            read_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
        CREATE INDEX idx_messages_sender_id ON messages(sender_id);
        CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
    END IF;
END $$;

-- =====================================================
-- Enable RLS
-- =====================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Drop and recreate policies for conversations
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON conversations;

CREATE POLICY "Users can view their own conversations" ON conversations
    FOR SELECT USING (participant_1 = auth.uid() OR participant_2 = auth.uid());

CREATE POLICY "Users can create conversations they participate in" ON conversations
    FOR INSERT WITH CHECK (participant_1 = auth.uid() OR participant_2 = auth.uid());

CREATE POLICY "Users can update their own conversations" ON conversations
    FOR UPDATE USING (participant_1 = auth.uid() OR participant_2 = auth.uid());

CREATE POLICY "Users can delete their own conversations" ON conversations
    FOR DELETE USING (participant_1 = auth.uid() OR participant_2 = auth.uid());

-- =====================================================
-- Drop and recreate policies for messages
-- =====================================================

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations c 
            WHERE c.id = messages.conversation_id 
            AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
        )
    );

CREATE POLICY "Users can send messages in their conversations" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM conversations c 
            WHERE c.id = messages.conversation_id 
            AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
        )
    );

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (sender_id = auth.uid());

-- =====================================================
-- Create or update trigger for last_message_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET 
        last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.content, 100)
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- =====================================================
-- Verify setup
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Messaging tables and policies have been set up correctly!';
    RAISE NOTICE 'You can now send direct messages.';
END $$;

-- To test, run this query to see your conversations:
-- SELECT * FROM conversations WHERE participant_1 = auth.uid() OR participant_2 = auth.uid();
