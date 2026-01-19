-- Migration: Fix class duration from 1.5 hours to 1 hour
-- With hourly time slots, classes should be 1 hour long, not 1.5 hours

-- Update all time slots to have end_time = start_time + 1 hour
UPDATE time_slots
SET end_time = start_time + INTERVAL '1 hour';
