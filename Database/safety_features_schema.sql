-- =====================================================
-- SAFETY FEATURES SCHEMA
-- =====================================================
-- Tables for user blocking and content reporting
-- Required for App Store Review compliance (5.1.1 Privacy + 2.1 App Completeness)

-- =====================================================
-- BLOCKED USERS TABLE
-- =====================================================
-- Stores relationships where one user has blocked another

CREATE TABLE IF NOT EXISTS blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure a user can only block another user once
    UNIQUE(user_id, blocked_user_id),
    
    -- Prevent self-blocking
    CHECK (user_id != blocked_user_id)
);

-- Index for fast lookups when checking if a user is blocked
CREATE INDEX IF NOT EXISTS idx_blocked_users_user_id 
    ON blocked_users(user_id);

CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_user_id 
    ON blocked_users(blocked_user_id);

-- Row Level Security (RLS) for blocked_users
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own blocks
CREATE POLICY "Users can view their own blocks"
    ON blocked_users FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can block other users
CREATE POLICY "Users can block others"
    ON blocked_users FOR INSERT
    WITH CHECK (auth.uid() = user_id AND user_id != blocked_user_id);

-- Policy: Users can unblock users they have blocked
CREATE POLICY "Users can unblock others"
    ON blocked_users FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- REPORTS TABLE
-- =====================================================
-- Stores user reports for moderation

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('user', 'message', 'game', 'post')),
    content_id UUID NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('harassment', 'spam', 'inappropriate', 'fake_profile', 'safety_concern', 'other')),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    moderator_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for reports
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id 
    ON reports(reporter_id);

CREATE INDEX IF NOT EXISTS idx_reports_content 
    ON reports(content_type, content_id);

CREATE INDEX IF NOT EXISTS idx_reports_status 
    ON reports(status);

CREATE INDEX IF NOT EXISTS idx_reports_created_at 
    ON reports(created_at DESC);

-- Row Level Security (RLS) for reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own reports
CREATE POLICY "Users can view their own reports"
    ON reports FOR SELECT
    USING (auth.uid() = reporter_id);

-- Policy: Users can create reports
CREATE POLICY "Users can create reports"
    ON reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

-- Policy: Only admins/moderators can update reports (add admin check if you have roles)
-- For now, no one can update via the app (admin dashboard only)

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reports_updated_at_trigger
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_reports_updated_at();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if user A has blocked user B
CREATE OR REPLACE FUNCTION is_user_blocked(user_a UUID, user_b UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM blocked_users
        WHERE user_id = user_a AND blocked_user_id = user_b
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ADDITIONAL RECOMMENDATIONS
-- =====================================================

-- Add to existing messages table to respect blocks
-- Modify your messages query to filter out blocked users:
/*
SELECT m.* 
FROM messages m
WHERE m.conversation_id = <conversation_id>
  AND NOT is_user_blocked(auth.uid(), m.sender_id)
  AND NOT is_user_blocked(m.sender_id, auth.uid())
ORDER BY m.created_at ASC;
*/

-- Add to existing games/posts queries to filter blocked users
-- This ensures blocked users don't see each other's content

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if tables were created successfully
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
--   AND tablename IN ('blocked_users', 'reports');

-- Test blocking functionality
-- INSERT INTO blocked_users (user_id, blocked_user_id) 
--   VALUES ('<user_uuid>', '<blocked_user_uuid>');

