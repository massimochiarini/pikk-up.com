-- Add instructor application note column for pending instructor requests
-- This is a temporary field visible to admins when reviewing applications

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS instructor_application_note TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.instructor_application_note IS 'Temporary note from instructor applicants explaining their qualifications. Cleared after approval/rejection.';
