-- Add guest_email column to bookings table for email confirmations
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_email TEXT;

-- Add index for guest_email lookups
CREATE INDEX IF NOT EXISTS idx_bookings_guest_email ON bookings(guest_email);
