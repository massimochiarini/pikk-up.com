-- Add guest_email column to bookings table for email confirmations
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_email TEXT;

-- Add index for guest_email lookups
CREATE INDEX IF NOT EXISTS idx_bookings_guest_email ON bookings(guest_email);

-- Add guest_email column to package_credits table
ALTER TABLE package_credits ADD COLUMN IF NOT EXISTS guest_email TEXT;

-- Add index for package_credits guest_email lookups
CREATE INDEX IF NOT EXISTS idx_package_credits_guest_email ON package_credits(guest_email);

-- Update get_available_credits function to use email instead of phone
CREATE OR REPLACE FUNCTION get_available_credits(
  p_instructor_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_email TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  total_credits INTEGER;
BEGIN
  SELECT COALESCE(SUM(classes_remaining), 0) INTO total_credits
  FROM package_credits
  WHERE instructor_id = p_instructor_id
    AND classes_remaining > 0
    AND (
      (p_user_id IS NOT NULL AND user_id = p_user_id)
      OR (p_email IS NOT NULL AND guest_email = LOWER(TRIM(p_email)))
    );
  
  RETURN total_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update use_package_credit function to use email instead of phone
CREATE OR REPLACE FUNCTION use_package_credit(
  p_instructor_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_email TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  credit_id UUID;
BEGIN
  -- Find the oldest credit with remaining classes
  SELECT id INTO credit_id
  FROM package_credits
  WHERE instructor_id = p_instructor_id
    AND classes_remaining > 0
    AND (
      (p_user_id IS NOT NULL AND user_id = p_user_id)
      OR (p_email IS NOT NULL AND guest_email = LOWER(TRIM(p_email)))
    )
  ORDER BY purchased_at ASC
  LIMIT 1;
  
  IF credit_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Decrement the credit
  UPDATE package_credits
  SET classes_remaining = classes_remaining - 1
  WHERE id = credit_id;
  
  RETURN credit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
