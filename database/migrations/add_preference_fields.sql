-- Add new preference fields to user_preferences table
-- Session 8: Settings & Preferences
-- Date: November 25, 2025

-- Add notification preference columns
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS class_reminders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS weekly_summary BOOLEAN DEFAULT false;

-- Add privacy settings columns
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS analytics_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS data_sharing_enabled BOOLEAN DEFAULT false;

-- Update existing rows to have default values
UPDATE user_preferences
SET
  email_notifications = COALESCE(email_notifications, true),
  class_reminders = COALESCE(class_reminders, true),
  weekly_summary = COALESCE(weekly_summary, false),
  analytics_enabled = COALESCE(analytics_enabled, true),
  data_sharing_enabled = COALESCE(data_sharing_enabled, false)
WHERE email_notifications IS NULL
   OR class_reminders IS NULL
   OR weekly_summary IS NULL
   OR analytics_enabled IS NULL
   OR data_sharing_enabled IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN user_preferences.email_notifications IS 'User wants to receive email notifications about account activity';
COMMENT ON COLUMN user_preferences.class_reminders IS 'User wants to receive notifications before scheduled classes';
COMMENT ON COLUMN user_preferences.weekly_summary IS 'User wants to receive a weekly summary of their progress';
COMMENT ON COLUMN user_preferences.analytics_enabled IS 'User allows sharing anonymous usage data for analytics';
COMMENT ON COLUMN user_preferences.data_sharing_enabled IS 'User allows sharing data with third-party services';
