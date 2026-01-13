-- Yoga Studio Marketplace Database Schema
-- Run this in Supabase SQL Editor

-- =====================================================
-- PROFILES TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_instructor BOOLEAN DEFAULT FALSE,
  bio TEXT,
  instagram TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- TIME SLOTS TABLE (Studio-defined available slots)
-- =====================================================
CREATE TABLE IF NOT EXISTS time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, start_time)
);

-- Enable RLS
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

-- Time slots policies
CREATE POLICY "Anyone can view time slots"
  ON time_slots FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert time slots"
  ON time_slots FOR INSERT
  WITH CHECK (false); -- Will use service role for this

CREATE POLICY "Authenticated users can claim available slots"
  ON time_slots FOR UPDATE
  USING (
    auth.role() = 'authenticated' 
    AND status = 'available'
  );

-- =====================================================
-- CLASSES TABLE (Yoga classes created by instructors)
-- =====================================================
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  time_slot_id UUID NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  max_capacity INTEGER NOT NULL DEFAULT 15,
  skill_level TEXT DEFAULT 'all' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'all')),
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(time_slot_id)
);

-- Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Classes policies
CREATE POLICY "Anyone can view upcoming classes"
  ON classes FOR SELECT
  USING (true);

CREATE POLICY "Instructors can create classes"
  ON classes FOR INSERT
  WITH CHECK (
    auth.uid() = instructor_id
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_instructor = true
    )
  );

CREATE POLICY "Instructors can update their own classes"
  ON classes FOR UPDATE
  USING (auth.uid() = instructor_id);

CREATE POLICY "Instructors can delete their own classes"
  ON classes FOR DELETE
  USING (auth.uid() = instructor_id);

-- =====================================================
-- BOOKINGS TABLE (Student reservations)
-- =====================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  guest_first_name TEXT,
  guest_last_name TEXT,
  guest_phone TEXT,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Bookings policies
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM classes WHERE classes.id = class_id AND classes.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can cancel their own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role bypass for webhooks
CREATE POLICY "Service role can view all bookings"
  ON bookings FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can insert bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- PAYMENTS TABLE (Stripe payment records)
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  stripe_checkout_session_id TEXT NOT NULL,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  customer_name TEXT,
  customer_phone TEXT,
  error_message TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Payments policies (mostly service role)
CREATE POLICY "Instructors can view payments for their classes"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes WHERE classes.id = class_id AND classes.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage payments"
  ON payments FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to get booking count for a class
CREATE OR REPLACE FUNCTION get_booking_count(class_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM bookings
  WHERE class_id = class_uuid AND status = 'confirmed';
$$ LANGUAGE SQL STABLE;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- INDEXES for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_time_slots_date ON time_slots(date);
CREATE INDEX IF NOT EXISTS idx_time_slots_status ON time_slots(status);
CREATE INDEX IF NOT EXISTS idx_classes_instructor ON classes(instructor_id);
CREATE INDEX IF NOT EXISTS idx_classes_time_slot ON classes(time_slot_id);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
CREATE INDEX IF NOT EXISTS idx_bookings_class ON bookings(class_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_class ON payments(class_id);

-- =====================================================
-- SEED DATA: Generate time slots for next 30 days
-- =====================================================
-- This creates time slots at 7am, 9am, 11am, 1pm, 5pm, 7pm

DO $$
DECLARE
  curr_date DATE := CURRENT_DATE;
  slot_times TIME[] := ARRAY['07:00:00', '09:00:00', '11:00:00', '13:00:00', '17:00:00', '19:00:00']::TIME[];
  slot_time TIME;
BEGIN
  FOR i IN 0..30 LOOP
    FOREACH slot_time IN ARRAY slot_times LOOP
      INSERT INTO time_slots (date, start_time, end_time, status)
      VALUES (
        curr_date + i,
        slot_time,
        slot_time + INTERVAL '1 hour 30 minutes',
        'available'
      )
      ON CONFLICT (date, start_time) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
