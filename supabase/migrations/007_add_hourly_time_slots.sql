-- Migration: Add hourly time slots (7 AM to 7 PM)
-- Previously we only had: 7, 9, 11, 1 PM, 5 PM, 7 PM
-- Now adding: 8, 10, 12, 2 PM, 3 PM, 4 PM, 6 PM

-- Add missing hourly time slots for existing dates (next 60 days to be safe)
DO $$
DECLARE
  curr_date DATE := CURRENT_DATE;
  -- The new times we need to add (that weren't in the original schema)
  new_slot_times TIME[] := ARRAY['08:00:00', '10:00:00', '12:00:00', '14:00:00', '15:00:00', '16:00:00', '18:00:00']::TIME[];
  slot_time TIME;
BEGIN
  -- Add slots for the next 60 days
  FOR i IN 0..60 LOOP
    FOREACH slot_time IN ARRAY new_slot_times LOOP
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

-- Fix Jasmyn's class: Move from 9 AM to 10 AM on Jan 24, 2026
-- First, we need to make sure the 10 AM slot exists for that date
INSERT INTO time_slots (date, start_time, end_time, status)
VALUES ('2026-01-24', '10:00:00', '11:30:00', 'claimed')
ON CONFLICT (date, start_time) DO UPDATE SET status = 'claimed';

-- Get the old 9 AM slot ID and new 10 AM slot ID, then update the class
DO $$
DECLARE
  old_slot_id UUID;
  new_slot_id UUID;
BEGIN
  -- Find the 9 AM slot on Jan 24
  SELECT id INTO old_slot_id
  FROM time_slots
  WHERE date = '2026-01-24' AND start_time = '09:00:00';
  
  -- Find the 10 AM slot on Jan 24
  SELECT id INTO new_slot_id
  FROM time_slots
  WHERE date = '2026-01-24' AND start_time = '10:00:00';
  
  -- Update any class that was on the 9 AM slot to use the 10 AM slot
  IF old_slot_id IS NOT NULL AND new_slot_id IS NOT NULL THEN
    UPDATE classes
    SET time_slot_id = new_slot_id
    WHERE time_slot_id = old_slot_id;
    
    -- Mark the old 9 AM slot as available again
    UPDATE time_slots
    SET status = 'available'
    WHERE id = old_slot_id;
  END IF;
END $$;
