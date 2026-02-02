-- Add Google Calendar OAuth columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_calendar_access_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_calendar_token_expiry TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_calendar_id TEXT; -- Optional: specific calendar ID to use

-- Add google_calendar_event_id to classes table to track synced events
ALTER TABLE classes ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;

-- Create index for looking up classes by calendar event ID
CREATE INDEX IF NOT EXISTS idx_classes_google_calendar_event_id ON classes(google_calendar_event_id);

-- Comment for documentation
COMMENT ON COLUMN profiles.google_calendar_access_token IS 'OAuth2 access token for Google Calendar API';
COMMENT ON COLUMN profiles.google_calendar_refresh_token IS 'OAuth2 refresh token for Google Calendar API';
COMMENT ON COLUMN profiles.google_calendar_token_expiry IS 'Expiry timestamp for the access token';
COMMENT ON COLUMN profiles.google_calendar_connected IS 'Whether Google Calendar is connected';
COMMENT ON COLUMN profiles.google_calendar_id IS 'Optional specific calendar ID (defaults to primary)';
COMMENT ON COLUMN classes.google_calendar_event_id IS 'Google Calendar event ID for synced classes';
