-- Move Yoga Therapy class to 6:30 PM
-- Updates the time slot associated with any class titled 'Yoga Therapy'

UPDATE time_slots 
SET 
  start_time = '18:30:00',
  end_time = '20:00:00'  -- 1 hour class + 30 min buffer = 1.5 hours total
WHERE id IN (
  SELECT time_slot_id FROM classes WHERE title = 'Yoga Therapy'
);
