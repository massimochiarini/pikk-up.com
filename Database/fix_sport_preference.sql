-- Fix sport preference for all users
-- This ensures all users can see both yoga and pickleball games by default

-- Add sport_preference column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sport_preference TEXT DEFAULT 'both';

-- Update all existing users who don't have a preference set to "both"
UPDATE profiles 
SET sport_preference = 'both' 
WHERE sport_preference IS NULL OR sport_preference = '';

-- Update users who only have pickleball set to "both" so they can see yoga sessions
UPDATE profiles 
SET sport_preference = 'both' 
WHERE sport_preference = 'pickleball';
