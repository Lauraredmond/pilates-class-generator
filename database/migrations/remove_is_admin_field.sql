-- Migration to remove is_admin field and rely on user_type instead
-- The user_type field now handles admin identification (user_type = 'admin')

-- First, ensure all current admins have the correct user_type
UPDATE user_profiles
SET user_type = 'admin'
WHERE is_admin = true AND (user_type IS NULL OR user_type != 'admin');

-- Drop the is_admin column
ALTER TABLE user_profiles
DROP COLUMN IF EXISTS is_admin;

-- Add comment for clarity
COMMENT ON COLUMN user_profiles.user_type IS 'User type: standard (practitioner), coach, or admin. Replaces the old is_admin boolean field.';