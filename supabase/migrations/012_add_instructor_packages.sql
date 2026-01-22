-- Add instructor packages and student credit system
-- Instructors can create class packages (e.g., "5 classes for $100")
-- Students purchase packages and receive credits tied to that instructor

-- =====================================================
-- INSTRUCTOR PACKAGES TABLE (Package templates)
-- =====================================================
CREATE TABLE IF NOT EXISTS instructor_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  class_count INTEGER NOT NULL CHECK (class_count > 0),
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE instructor_packages ENABLE ROW LEVEL SECURITY;

-- Instructor packages policies
CREATE POLICY "Anyone can view active packages"
  ON instructor_packages FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Instructors can view all their own packages"
  ON instructor_packages FOR SELECT
  USING (auth.uid() = instructor_id);

CREATE POLICY "Instructors can create packages"
  ON instructor_packages FOR INSERT
  WITH CHECK (
    auth.uid() = instructor_id
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_instructor = TRUE
    )
  );

CREATE POLICY "Instructors can update their own packages"
  ON instructor_packages FOR UPDATE
  USING (auth.uid() = instructor_id);

CREATE POLICY "Instructors can delete their own packages"
  ON instructor_packages FOR DELETE
  USING (auth.uid() = instructor_id);

-- =====================================================
-- PACKAGE CREDITS TABLE (Student purchased credits)
-- =====================================================
CREATE TABLE IF NOT EXISTS package_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES instructor_packages(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  guest_phone TEXT,
  classes_remaining INTEGER NOT NULL CHECK (classes_remaining >= 0),
  classes_total INTEGER NOT NULL CHECK (classes_total > 0),
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure either user_id or guest_phone is set
  CONSTRAINT user_or_guest CHECK (user_id IS NOT NULL OR guest_phone IS NOT NULL)
);

-- Enable RLS
ALTER TABLE package_credits ENABLE ROW LEVEL SECURITY;

-- Package credits policies
CREATE POLICY "Users can view their own credits"
  ON package_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Instructors can view credits for their packages"
  ON package_credits FOR SELECT
  USING (auth.uid() = instructor_id);

CREATE POLICY "Service role can manage credits"
  ON package_credits FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to get available credits for a user with an instructor
CREATE OR REPLACE FUNCTION get_available_credits(
  p_instructor_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  total_credits INTEGER;
BEGIN
  SELECT COALESCE(SUM(classes_remaining), 0)
  INTO total_credits
  FROM package_credits
  WHERE instructor_id = p_instructor_id
    AND classes_remaining > 0
    AND (
      (p_user_id IS NOT NULL AND user_id = p_user_id)
      OR (p_phone IS NOT NULL AND guest_phone = p_phone)
    );
  
  RETURN total_credits;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to use a credit (decrement classes_remaining)
-- Returns the package_credit id that was decremented, or NULL if no credits available
CREATE OR REPLACE FUNCTION use_package_credit(
  p_instructor_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  credit_id UUID;
BEGIN
  -- Find the oldest credit with remaining classes (FIFO)
  SELECT id INTO credit_id
  FROM package_credits
  WHERE instructor_id = p_instructor_id
    AND classes_remaining > 0
    AND (
      (p_user_id IS NOT NULL AND user_id = p_user_id)
      OR (p_phone IS NOT NULL AND guest_phone = p_phone)
    )
  ORDER BY purchased_at ASC
  LIMIT 1
  FOR UPDATE;
  
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

-- =====================================================
-- INDEXES for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_instructor_packages_instructor ON instructor_packages(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_packages_active ON instructor_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_package_credits_instructor ON package_credits(instructor_id);
CREATE INDEX IF NOT EXISTS idx_package_credits_user ON package_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_package_credits_phone ON package_credits(guest_phone);
CREATE INDEX IF NOT EXISTS idx_package_credits_remaining ON package_credits(classes_remaining) WHERE classes_remaining > 0;
