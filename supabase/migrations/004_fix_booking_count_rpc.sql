-- Fix: Make get_booking_count accessible to anonymous users
-- The function needs SECURITY DEFINER to bypass RLS

-- Drop the old function and recreate with proper permissions
DROP FUNCTION IF EXISTS get_booking_count(UUID);

CREATE OR REPLACE FUNCTION get_booking_count(class_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM bookings
  WHERE class_id = class_uuid AND status = 'confirmed';
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION get_booking_count(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_booking_count(UUID) TO authenticated;
