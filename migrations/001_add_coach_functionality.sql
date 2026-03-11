-- =====================================================
-- MIGRATION: Add Coach Functionality to Bassline Pilates
-- Date: March 2024
-- Description: Adds user_type field, sport exercise tables, and coach features
-- =====================================================

-- =====================================================
-- STEP 1: Add user_type column to user_profiles
-- =====================================================

-- Add the user_type column without constraint first
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS user_type VARCHAR(20);

-- Update all existing users to 'standard' (practitioners)
UPDATE user_profiles
SET user_type = 'standard'
WHERE user_type IS NULL;

-- Update admin users to 'admin' (if is_admin field exists)
UPDATE user_profiles
SET user_type = 'admin'
WHERE is_admin = true AND user_type != 'admin';

-- Now add the CHECK constraint after data is populated
ALTER TABLE user_profiles
ADD CONSTRAINT user_type_check CHECK (user_type IN ('standard', 'coach', 'admin'));

-- Make user_type NOT NULL after migration
ALTER TABLE user_profiles
ALTER COLUMN user_type SET NOT NULL;

-- Set default value for future inserts
ALTER TABLE user_profiles
ALTER COLUMN user_type SET DEFAULT 'standard';

-- Add comment for clarity
COMMENT ON COLUMN user_profiles.user_type IS 'User type: standard (practitioner), coach, or admin. Replaces the old is_admin boolean field.';

-- =====================================================
-- STEP 2: Remove is_admin field (if it exists)
-- =====================================================

-- Drop the is_admin column if it exists
ALTER TABLE user_profiles
DROP COLUMN IF EXISTS is_admin;

-- =====================================================
-- STEP 3: Create sport_exercises table for exercise data
-- =====================================================

CREATE TABLE IF NOT EXISTS sport_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport VARCHAR(50) NOT NULL,
  exercise_name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  sport_relevance TEXT,
  injury_prevention TEXT,
  position_specific TEXT,
  variations JSONB,
  muscle_groups TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique exercises per sport
  UNIQUE(sport, exercise_name)
);

-- Add index for performance
CREATE INDEX idx_sport_exercises_sport ON sport_exercises(sport);
CREATE INDEX idx_sport_exercises_category ON sport_exercises(sport, category);

-- =====================================================
-- STEP 4: Create coach_sport_sessions table
-- =====================================================

CREATE TABLE IF NOT EXISTS coach_sport_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sport VARCHAR(50) NOT NULL,
  session_name VARCHAR(200) NOT NULL,
  team_name VARCHAR(200),
  session_date DATE,
  exercises JSONB NOT NULL, -- Array of exercise IDs and notes
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_coach_sport_sessions_coach ON coach_sport_sessions(coach_id);
CREATE INDEX idx_coach_sport_sessions_sport ON coach_sport_sessions(sport);
CREATE INDEX idx_coach_sport_sessions_date ON coach_sport_sessions(session_date);

-- =====================================================
-- STEP 5: Enable Row Level Security (RLS)
-- =====================================================

-- Enable RLS on both tables
ALTER TABLE sport_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_sport_sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 6: Create RLS Policies
-- =====================================================

-- Sport exercises are publicly readable but only admins can modify
CREATE POLICY "Sport exercises are viewable by all authenticated users" ON sport_exercises
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert sport exercises" ON sport_exercises
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND user_type = 'admin'
    )
  );

CREATE POLICY "Only admins can update sport exercises" ON sport_exercises
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND user_type = 'admin'
    )
  );

CREATE POLICY "Only admins can delete sport exercises" ON sport_exercises
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND user_type = 'admin'
    )
  );

-- Coach sessions policies - coaches can only see and modify their own sessions
CREATE POLICY "Coaches can view their own sessions" ON coach_sport_sessions
  FOR SELECT
  TO authenticated
  USING (
    coach_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND user_type = 'admin'
    )
  );

CREATE POLICY "Coaches can create their own sessions" ON coach_sport_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    coach_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND user_type IN ('coach', 'admin')
    )
  );

CREATE POLICY "Coaches can update their own sessions" ON coach_sport_sessions
  FOR UPDATE
  TO authenticated
  USING (
    coach_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND user_type = 'admin'
    )
  );

CREATE POLICY "Coaches can delete their own sessions" ON coach_sport_sessions
  FOR DELETE
  TO authenticated
  USING (
    coach_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND user_type = 'admin'
    )
  );

-- =====================================================
-- STEP 7: Grant necessary permissions
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT ON sport_exercises TO authenticated;
GRANT ALL ON coach_sport_sessions TO authenticated;

-- =====================================================
-- STEP 8: Create helper function to check user type
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_type(user_id UUID)
RETURNS VARCHAR(20)
AS $$
DECLARE
  user_type_val VARCHAR(20);
BEGIN
  SELECT user_type INTO user_type_val
  FROM user_profiles
  WHERE user_profiles.user_id = $1;

  RETURN COALESCE(user_type_val, 'standard');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 9: Add trigger to update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_sport_exercises_updated_at BEFORE UPDATE ON sport_exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coach_sport_sessions_updated_at BEFORE UPDATE ON coach_sport_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION QUERIES (Run these to check migration)
-- =====================================================

-- Check user_type distribution
-- SELECT user_type, COUNT(*) as count
-- FROM user_profiles
-- GROUP BY user_type;

-- Check if tables were created
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('sport_exercises', 'coach_sport_sessions');

-- Check RLS is enabled
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('sport_exercises', 'coach_sport_sessions');