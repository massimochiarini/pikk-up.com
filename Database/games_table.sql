-- =====================================================
-- GAMES TABLE - Actual structure used by iOS app
-- =====================================================

CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    sport TEXT NOT NULL DEFAULT 'pickleball',
    venue_name TEXT NOT NULL,
    address TEXT NOT NULL,
    game_date DATE NOT NULL,
    start_time TIME NOT NULL,
    max_players INTEGER NOT NULL DEFAULT 4,
    cost_cents INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    image_url TEXT,
    is_private BOOLEAN DEFAULT false,
    skill_level TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for games
CREATE INDEX IF NOT EXISTS idx_games_created_by ON games(created_by);
CREATE INDEX IF NOT EXISTS idx_games_game_date ON games(game_date);
CREATE INDEX IF NOT EXISTS idx_games_sport ON games(sport);
CREATE INDEX IF NOT EXISTS idx_games_skill_level ON games(skill_level) WHERE skill_level IS NOT NULL;

-- RLS policies are already defined in schema.sql (PHASE 9.5)

