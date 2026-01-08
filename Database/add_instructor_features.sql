-- =====================================================
-- Add instructor features: cover photos and precise location
-- =====================================================

-- Add latitude and longitude columns to games table for precise location
ALTER TABLE games ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE games ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Create indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_games_location ON games(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create storage bucket for game/class cover photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('game-images', 'game-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for game-images bucket
-- Anyone can view game cover photos
CREATE POLICY "Anyone can view game images" ON storage.objects
    FOR SELECT USING (bucket_id = 'game-images');

-- Authenticated users can upload game images
CREATE POLICY "Authenticated users can upload game images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'game-images' AND 
        auth.role() = 'authenticated'
    );

-- Users can update images for games they created
CREATE POLICY "Users can update their game images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'game-images' AND 
        auth.role() = 'authenticated'
    );

-- Users can delete images for games they created  
CREATE POLICY "Users can delete their game images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'game-images' AND 
        auth.role() = 'authenticated'
    );

-- Add custom event name field (separate from venue name)
-- This allows instructors to name their class (e.g. "Morning Vinyasa Flow") 
-- while venue_name still refers to the physical location
ALTER TABLE games ADD COLUMN IF NOT EXISTS custom_title TEXT;

-- Create index for custom title searches
CREATE INDEX IF NOT EXISTS idx_games_custom_title ON games(custom_title) 
WHERE custom_title IS NOT NULL;

-- Update comments
COMMENT ON COLUMN games.custom_title IS 'Custom event/class title set by instructor (e.g., "Morning Vinyasa Flow")';
COMMENT ON COLUMN games.venue_name IS 'Physical venue/studio name (e.g., "Pick Up Studio")';
COMMENT ON COLUMN games.latitude IS 'Precise latitude coordinate for location pin';
COMMENT ON COLUMN games.longitude IS 'Precise longitude coordinate for location pin';
COMMENT ON COLUMN games.image_url IS 'URL to cover photo in game-images storage bucket';
