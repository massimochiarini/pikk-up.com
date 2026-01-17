-- Migration: Add evening time slots (8 PM, 9 PM, 10 PM)
-- Extending schedule from 7 PM to 10 PM

DO $$
DECLARE
  curr_date DATE := CURRENT_DATE;
  evening_slot_times TIME[] := ARRAY['20:00:00', '21:00:00', '22:00:00']::TIME[];
  slot_time TIME;
BEGIN
  -- Add slots for the next 60 days
  FOR i IN 0..60 LOOP
    FOREACH slot_time IN ARRAY evening_slot_times LOOP
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
