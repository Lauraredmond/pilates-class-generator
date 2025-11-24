-- Migration 007: Add Registration Profile Fields
-- Created: 2025-11-24
-- Purpose: Capture user demographics and goals during registration

-- ============================================================================
-- ADD PROFILE FIELDS TO USER_PROFILES TABLE
-- ============================================================================

-- Age range (not exact age for privacy)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS age_range VARCHAR(20);
COMMENT ON COLUMN user_profiles.age_range IS 'Age range: 18-24, 25-34, 35-44, 45-54, 55-64, 65+';

-- Gender identity (optional, useful for Pilates patterns)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gender_identity VARCHAR(50);
COMMENT ON COLUMN user_profiles.gender_identity IS 'Optional: Female, Male, Non-binary, Prefer not to say, Other';

-- Country (for time zones and music licensing)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS country VARCHAR(100);
COMMENT ON COLUMN user_profiles.country IS 'User country (ISO 3166-1 alpha-2 or full name)';

-- Experience level with Pilates
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS pilates_experience VARCHAR(20);
COMMENT ON COLUMN user_profiles.pilates_experience IS 'Beginner, Intermediate, Advanced, Instructor';

-- Goal orientation (can select multiple, stored as JSONB array)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS goals JSONB DEFAULT '[]'::jsonb;
COMMENT ON COLUMN user_profiles.goals IS 'Array of goals: stress_relief, tone_strength, performance, habit_building';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_pilates_experience ON user_profiles(pilates_experience);
CREATE INDEX IF NOT EXISTS idx_user_profiles_country ON user_profiles(country);
CREATE INDEX IF NOT EXISTS idx_user_profiles_age_range ON user_profiles(age_range);

-- ============================================================================
-- ADD VALIDATION CONSTRAINTS
-- ============================================================================

-- Validate age_range values
ALTER TABLE user_profiles ADD CONSTRAINT check_age_range
    CHECK (age_range IS NULL OR age_range IN ('18-24', '25-34', '35-44', '45-54', '55-64', '65+'));

-- Validate pilates_experience values
ALTER TABLE user_profiles ADD CONSTRAINT check_pilates_experience
    CHECK (pilates_experience IS NULL OR pilates_experience IN ('Beginner', 'Intermediate', 'Advanced', 'Instructor'));

-- ============================================================================
-- UPDATE USER_PREFERENCES TABLE (if additional fields needed)
-- ============================================================================

-- Ensure user_preferences has goal-related fields (if not using user_profiles.goals)
-- Note: We're using user_profiles.goals for simplicity, but preferences could have:
-- - preferred_class_style (classical, contemporary, fusion)
-- - preferred_intensity (low, moderate, high)
-- - preferred_duration (30, 45, 60, 90 minutes)

-- ============================================================================
-- DATA MIGRATION (Optional: Set defaults for existing users)
-- ============================================================================

-- Set default values for existing users (optional)
-- UPDATE user_profiles
-- SET pilates_experience = 'Beginner'
-- WHERE pilates_experience IS NULL AND created_at < NOW();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check schema updates:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'user_profiles'
-- AND column_name IN ('age_range', 'gender_identity', 'country', 'pilates_experience', 'goals')
-- ORDER BY ordinal_position;

-- Check constraints:
-- SELECT constraint_name, check_clause
-- FROM information_schema.check_constraints
-- WHERE constraint_name LIKE 'check_%';

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_profiles IS 'User profiles with demographics and Pilates experience for personalization';
