-- Sports App Social Network - Database Schema Migration
-- Run these migrations in order in your Supabase SQL Editor

-- =====================================================
-- PHASE 0: Create profiles table and auto-creation trigger
-- =====================================================

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'first_name', ''),
        COALESCE(new.raw_user_meta_data->>'last_name', '')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists (to avoid errors on re-run)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- PHASE 0.5: Ensure profile exists function (called from app)
-- This function bypasses RLS to create profiles when needed
-- =====================================================

CREATE OR REPLACE FUNCTION public.ensure_profile_exists(
    p_user_id UUID,
    p_first_name TEXT DEFAULT '',
    p_last_name TEXT DEFAULT ''
)
RETURNS VOID AS $$
BEGIN
    -- Insert the profile if it doesn't exist
    INSERT INTO public.profiles (id, first_name, last_name, created_at)
    VALUES (p_user_id, p_first_name, p_last_name, NOW())
    ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PHASE 1: Expand profiles table
-- =====================================================

-- Add new columns to existing profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_sports TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS visibility_radius_miles INTEGER DEFAULT 25;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sport_preference TEXT DEFAULT 'both';

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- RLS policies for profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view all profiles (for discovery, viewing other players)
CREATE POLICY "Users can view all profiles" ON profiles
    FOR SELECT USING (true);

-- Allow users to insert their own profile (for when profile is created on signup)
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

-- Allow users to delete their own profile
CREATE POLICY "Users can delete their own profile" ON profiles
    FOR DELETE USING (id = auth.uid());

-- =====================================================
-- PHASE 2: Create posts table (Looking to Play)
-- =====================================================

CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    sport TEXT NOT NULL,
    headline TEXT NOT NULL,
    time_window TEXT,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_active ON posts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_sport ON posts(sport);

-- RLS policies for posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all active posts" ON posts
    FOR SELECT USING (is_active = true OR user_id = auth.uid());

CREATE POLICY "Users can create their own posts" ON posts
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own posts" ON posts
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own posts" ON posts
    FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- PHASE 3: Create conversations table
-- =====================================================

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_1 UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    participant_2 UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    context_type TEXT, -- 'post', 'game', 'profile'
    context_id UUID,
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT different_participants CHECK (participant_1 != participant_2)
);

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON conversations(participant_2);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- Unique constraint to prevent duplicate conversations
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_unique_pair 
    ON conversations(LEAST(participant_1, participant_2), GREATEST(participant_1, participant_2));

-- RLS policies for conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations" ON conversations
    FOR SELECT USING (participant_1 = auth.uid() OR participant_2 = auth.uid());

CREATE POLICY "Users can create conversations they participate in" ON conversations
    FOR INSERT WITH CHECK (participant_1 = auth.uid() OR participant_2 = auth.uid());

CREATE POLICY "Users can update their own conversations" ON conversations
    FOR UPDATE USING (participant_1 = auth.uid() OR participant_2 = auth.uid());

-- =====================================================
-- PHASE 4: Create messages table
-- =====================================================

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, read_at) WHERE read_at IS NULL;

-- RLS policies for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

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
-- PHASE 5: Create connections table
-- =====================================================

CREATE TABLE IF NOT EXISTS connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    connected_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    connection_type TEXT NOT NULL, -- 'played_together', 'friend', 'messaged'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT different_users CHECK (user_id != connected_user_id)
);

-- Indexes for connections
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_connected_user_id ON connections(connected_user_id);
CREATE INDEX IF NOT EXISTS idx_connections_type ON connections(connection_type);

-- Unique constraint to prevent duplicate connections
CREATE UNIQUE INDEX IF NOT EXISTS idx_connections_unique 
    ON connections(user_id, connected_user_id, connection_type);

-- RLS policies for connections
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own connections" ON connections
    FOR SELECT USING (user_id = auth.uid() OR connected_user_id = auth.uid());

CREATE POLICY "Users can create connections involving themselves" ON connections
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own connections" ON connections
    FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- PHASE 6: Helper functions
-- =====================================================

-- Function to update conversation's last_message_at when a message is sent
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
$$ LANGUAGE plpgsql;

-- Trigger to auto-update conversation on new message
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- Function to auto-create connection when users message each other
CREATE OR REPLACE FUNCTION create_messaged_connection()
RETURNS TRIGGER AS $$
DECLARE
    other_user_id UUID;
BEGIN
    -- Get the other participant
    SELECT CASE 
        WHEN c.participant_1 = NEW.sender_id THEN c.participant_2
        ELSE c.participant_1
    END INTO other_user_id
    FROM conversations c
    WHERE c.id = NEW.conversation_id;
    
    -- Insert connection if not exists
    INSERT INTO connections (user_id, connected_user_id, connection_type)
    VALUES (NEW.sender_id, other_user_id, 'messaged')
    ON CONFLICT (user_id, connected_user_id, connection_type) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create connection on message
DROP TRIGGER IF EXISTS trigger_create_messaged_connection ON messages;
CREATE TRIGGER trigger_create_messaged_connection
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION create_messaged_connection();

-- =====================================================
-- PHASE 7: Create storage bucket for avatars
-- =====================================================

-- Run this in Supabase dashboard > Storage > Create new bucket
-- Bucket name: avatars
-- Public bucket: true

-- Or via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
-- Note: Using LOWER() for case-insensitive comparison since Swift UUIDs may be uppercase
CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND 
        LOWER(auth.uid()::text) = LOWER((storage.foldername(name))[1])
    );

CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' AND 
        LOWER(auth.uid()::text) = LOWER((storage.foldername(name))[1])
    );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' AND 
        LOWER(auth.uid()::text) = LOWER((storage.foldername(name))[1])
    );

-- =====================================================
-- PHASE 8: Enable realtime for messages
-- =====================================================

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- =====================================================
-- PHASE 9: Update games table with sport and description
-- =====================================================

-- Add sport column to games table (defaults to pickleball for existing records)
ALTER TABLE games ADD COLUMN IF NOT EXISTS sport TEXT NOT NULL DEFAULT 'pickleball';

-- Add description column for optional game notes
ALTER TABLE games ADD COLUMN IF NOT EXISTS description TEXT;

-- Add skill_level column for optional skill level specification
-- Values: 'beginner', 'intermediate', 'advanced' or NULL (not specified)
ALTER TABLE games ADD COLUMN IF NOT EXISTS skill_level TEXT;

-- Create index for sport lookups
CREATE INDEX IF NOT EXISTS idx_games_sport ON games(sport);

-- Create index for skill level filtering
CREATE INDEX IF NOT EXISTS idx_games_skill_level ON games(skill_level) WHERE skill_level IS NOT NULL;

-- =====================================================
-- PHASE 9.5: RLS policies for games table
-- =====================================================

-- Enable RLS on games table
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view public games and their own private games
CREATE POLICY "Users can view public games and own private games" ON games
    FOR SELECT USING (
        is_private = false 
        OR is_private IS NULL 
        OR created_by = auth.uid()
    );

-- Allow users to create their own games
CREATE POLICY "Users can create their own games" ON games
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Allow users to update their own games
CREATE POLICY "Users can update their own games" ON games
    FOR UPDATE USING (created_by = auth.uid());

-- Allow users to delete their own games
CREATE POLICY "Users can delete their own games" ON games
    FOR DELETE USING (created_by = auth.uid());

-- =====================================================
-- PHASE 10: Ensure rsvps table exists for game participants
-- =====================================================

-- The rsvps table serves as the game_participants table
-- It links game_id to user_id to track who has joined each game
CREATE TABLE IF NOT EXISTS rsvps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_game_user UNIQUE (game_id, user_id)
);

-- Indexes for rsvps
CREATE INDEX IF NOT EXISTS idx_rsvps_game_id ON rsvps(game_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_user_id ON rsvps(user_id);

-- RLS policies for rsvps
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all rsvps" ON rsvps
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own rsvps" ON rsvps
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own rsvps" ON rsvps
    FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- PHASE 11: Group chats for games
-- =====================================================

-- Group chats table (one per game)
CREATE TABLE IF NOT EXISTS group_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for group_chats
CREATE INDEX IF NOT EXISTS idx_group_chats_game_id ON group_chats(game_id);

-- Group chat members table
CREATE TABLE IF NOT EXISTS group_chat_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_chat_id UUID REFERENCES group_chats(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_group_member UNIQUE (group_chat_id, user_id)
);

-- Indexes for group_chat_members
CREATE INDEX IF NOT EXISTS idx_group_chat_members_group_id ON group_chat_members(group_chat_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_members_user_id ON group_chat_members(user_id);

-- Group messages table (separate from 1-to-1 messages for clarity)
CREATE TABLE IF NOT EXISTS group_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_chat_id UUID REFERENCES group_chats(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for group_messages
CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON group_messages(group_chat_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages(created_at DESC);

-- RLS policies for group_chats
ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view group chats they are members of" ON group_chats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_chat_members gcm 
            WHERE gcm.group_chat_id = group_chats.id 
            AND gcm.user_id = auth.uid()
        )
    );

CREATE POLICY "Game creators can create group chats" ON group_chats
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM games g 
            WHERE g.id = group_chats.game_id 
            AND g.created_by = auth.uid()
        )
    );

-- RLS policies for group_chat_members
ALTER TABLE group_chat_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members of their group chats" ON group_chat_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_chat_members gcm 
            WHERE gcm.group_chat_id = group_chat_members.group_chat_id 
            AND gcm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join group chats for games they RSVP to" ON group_chat_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave group chats" ON group_chat_members
    FOR DELETE USING (user_id = auth.uid());

-- RLS policies for group_messages
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their group chats" ON group_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_chat_members gcm 
            WHERE gcm.group_chat_id = group_messages.group_chat_id 
            AND gcm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages to their group chats" ON group_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM group_chat_members gcm 
            WHERE gcm.group_chat_id = group_messages.group_chat_id 
            AND gcm.user_id = auth.uid()
        )
    );

-- Function to update group_chats last activity (for sorting)
ALTER TABLE group_chats ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;
ALTER TABLE group_chats ADD COLUMN IF NOT EXISTS last_message_preview TEXT;

CREATE OR REPLACE FUNCTION update_group_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE group_chats 
    SET 
        last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.content, 100)
    WHERE id = NEW.group_chat_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_group_chat_last_message ON group_messages;
CREATE TRIGGER trigger_update_group_chat_last_message
    AFTER INSERT ON group_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_group_chat_last_message();

-- Enable realtime for group messages
ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE group_chat_members;

-- =====================================================
-- PHASE 12: Add reply support to group messages
-- =====================================================

-- Add reply columns to group_messages table
ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES group_messages(id) ON DELETE SET NULL;
ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS reply_to_content TEXT;
ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS reply_to_sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for reply lookups
CREATE INDEX IF NOT EXISTS idx_group_messages_reply_to ON group_messages(reply_to_id) WHERE reply_to_id IS NOT NULL;

-- =====================================================
-- PHASE 13: Push Notifications - Device Tokens
-- =====================================================

-- Table to store device tokens for push notifications
CREATE TABLE IF NOT EXISTS device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    token TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'ios', -- 'ios' or 'android'
    app_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_token UNIQUE (user_id, token)
);

-- Indexes for device_tokens
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON device_tokens(token);

-- RLS policies for device_tokens
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only view their own device tokens
CREATE POLICY "Users can view their own device tokens" ON device_tokens
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own device tokens
CREATE POLICY "Users can insert their own device tokens" ON device_tokens
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own device tokens
CREATE POLICY "Users can update their own device tokens" ON device_tokens
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own device tokens
CREATE POLICY "Users can delete their own device tokens" ON device_tokens
    FOR DELETE USING (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_device_token_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS trigger_update_device_token_timestamp ON device_tokens;
CREATE TRIGGER trigger_update_device_token_timestamp
    BEFORE UPDATE ON device_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_device_token_timestamp();

-- =====================================================
-- PHASE 14: Push Notification Triggers
-- =====================================================

-- Function to be called by Edge Function to get recipient tokens
-- This is a helper function for the Edge Function to query tokens
CREATE OR REPLACE FUNCTION get_push_tokens_for_conversation(conv_id UUID, exclude_user_id UUID)
RETURNS TABLE (token TEXT, user_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT dt.token, dt.user_id
    FROM device_tokens dt
    JOIN conversations c ON (c.participant_1 = dt.user_id OR c.participant_2 = dt.user_id)
    WHERE c.id = conv_id
    AND dt.user_id != exclude_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tokens for group chat members
CREATE OR REPLACE FUNCTION get_push_tokens_for_group_chat(chat_id UUID, exclude_user_id UUID)
RETURNS TABLE (token TEXT, user_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT dt.token, dt.user_id
    FROM device_tokens dt
    JOIN group_chat_members gcm ON gcm.user_id = dt.user_id
    WHERE gcm.group_chat_id = chat_id
    AND dt.user_id != exclude_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

