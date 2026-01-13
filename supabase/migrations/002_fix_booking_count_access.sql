-- Fix booking count function to work for anonymous users
-- The function needs SECURITY DEFINER to bypass RLS when counting bookings

CREATE OR REPLACE FUNCTION get_booking_count(class_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM bookings
  WHERE class_id = class_uuid AND status = 'confirmed';
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION get_booking_count(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_booking_count(UUID) TO authenticated;
