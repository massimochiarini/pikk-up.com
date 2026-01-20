-- Add donation pricing support to classes
-- Classes with is_donation = true allow users to enter their own amount (including $0)

-- Add is_donation column to classes table
ALTER TABLE classes ADD COLUMN IF NOT EXISTS is_donation BOOLEAN DEFAULT FALSE;

-- Update existing free classes (price_cents = 0) to be donation-based
UPDATE classes SET is_donation = TRUE WHERE price_cents = 0;

-- Add index for querying donation classes
CREATE INDEX IF NOT EXISTS idx_classes_is_donation ON classes(is_donation);
