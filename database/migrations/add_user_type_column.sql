-- Migration to add user_type column to user_profiles table
-- This column distinguishes between standard (practitioner), coach, and admin users

-- Add user_type column with default value 'standard'
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'standard'
CHECK (user_type IN ('standard', 'coach', 'admin'));

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);

-- Update existing admin users to have admin user_type
UPDATE user_profiles
SET user_type = 'admin'
WHERE is_admin = true AND user_type = 'standard';

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.user_type IS 'User type: standard (practitioner), coach, or admin. Admin is not selectable at registration.';