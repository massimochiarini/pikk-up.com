-- Add sport preference column to profiles table
-- This allows users to select their sport preference during signup
-- Options: 'pickleball', 'yoga', or 'both'

-- Add the sport_preference column with constraint
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS sport_preference TEXT 
CHECK (sport_preference IN ('pickleball', 'yoga', 'both'))
DEFAULT 'pickleball';

-- Set default for existing users to maintain backward compatibility
UPDATE profiles 
SET sport_preference = 'pickleball' 
WHERE sport_preference IS NULL;

-- Create index for efficient filtering by sport preference
CREATE INDEX IF NOT EXISTS idx_profiles_sport_preference 
ON profiles(sport_preference);

-- Add comment for documentation
COMMENT ON COLUMN profiles.sport_preference IS 
'User sport preference selected during signup: pickleball, yoga, or both. Controls app theming.';

x