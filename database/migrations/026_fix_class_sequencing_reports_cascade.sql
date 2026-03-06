-- Migration 026: Fix class_sequencing_reports foreign key to cascade deletes
-- Purpose: Add ON DELETE CASCADE to allow user deletion to work properly

-- Drop the existing foreign key constraint
ALTER TABLE class_sequencing_reports
DROP CONSTRAINT IF EXISTS class_sequencing_reports_user_id_fkey;

-- Add it back with ON DELETE CASCADE
ALTER TABLE class_sequencing_reports
ADD CONSTRAINT class_sequencing_reports_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES user_profiles(id)
ON DELETE CASCADE;

-- Verify the constraint was updated
-- You should see ON DELETE CASCADE in the constraint definition
COMMENT ON TABLE class_sequencing_reports IS 'Updated: Added CASCADE delete for user_id foreign key to enable proper user account deletion';