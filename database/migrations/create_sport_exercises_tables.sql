-- Migration to create sport-specific exercise tables
-- This will store all exercise data for GAA, Soccer, and Rugby programmes

-- Create sport types enum
CREATE TYPE sport_type AS ENUM ('gaa', 'soccer', 'rugby');

-- Main exercises table
CREATE TABLE sport_exercises (
  id SERIAL PRIMARY KEY,
  sport sport_type NOT NULL,
  exercise_order INTEGER,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  classical BOOLEAN DEFAULT true,
  relevance INTEGER CHECK (relevance >= 1 AND relevance <= 5),
  description TEXT NOT NULL,

  -- Sport-specific content fields (column names vary by sport context)
  sport_context TEXT NOT NULL, -- hurling/soccer/rugby specific explanation
  youth_modification TEXT, -- U12mod for GAA, general modifications for others
  added_note TEXT, -- For non-classical exercises

  -- JSON fields for flexibility
  tags JSONB DEFAULT '[]'::jsonb,
  positions JSONB DEFAULT '[]'::jsonb, -- Relevant positions for this sport
  injury_areas JSONB DEFAULT '[]'::jsonb, -- Injury areas addressed

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_sport_exercises_sport ON sport_exercises(sport);
CREATE INDEX idx_sport_exercises_category ON sport_exercises(sport, category);
CREATE INDEX idx_sport_exercises_relevance ON sport_exercises(sport, relevance);
CREATE INDEX idx_sport_exercises_classical ON sport_exercises(sport, classical);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_sport_exercises_updated_at
BEFORE UPDATE ON sport_exercises
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Table for user-created sport sessions
CREATE TABLE coach_sport_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  sport sport_type NOT NULL,
  session_name VARCHAR(255) NOT NULL,
  exercise_ids INTEGER[] NOT NULL, -- Array of exercise IDs in session order
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for coach sessions
CREATE INDEX idx_coach_sport_sessions_coach ON coach_sport_sessions(coach_id);
CREATE INDEX idx_coach_sport_sessions_sport ON coach_sport_sessions(coach_id, sport);

-- Add trigger for coach_sport_sessions updated_at
CREATE TRIGGER update_coach_sport_sessions_updated_at
BEFORE UPDATE ON coach_sport_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Grant appropriate permissions (adjust based on your RLS policies)
GRANT SELECT ON sport_exercises TO authenticated;
GRANT ALL ON coach_sport_sessions TO authenticated;

-- Add RLS policies
ALTER TABLE sport_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_sport_sessions ENABLE ROW LEVEL SECURITY;

-- Everyone can read exercises
CREATE POLICY "Public exercises are viewable by all" ON sport_exercises
FOR SELECT USING (true);

-- Coaches can manage their own sessions
CREATE POLICY "Coaches can view their own sessions" ON coach_sport_sessions
FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can create sessions" ON coach_sport_sessions
FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update their own sessions" ON coach_sport_sessions
FOR UPDATE USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete their own sessions" ON coach_sport_sessions
FOR DELETE USING (auth.uid() = coach_id);