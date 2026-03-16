-- Add relevance_score field to sport_exercises table
-- This adds a 1-5 star rating for how relevant each exercise is to the sport

-- Add the relevance_score column
ALTER TABLE sport_exercises
ADD COLUMN IF NOT EXISTS relevance_score INTEGER DEFAULT 3
CHECK (relevance_score >= 1 AND relevance_score <= 5);

-- Update existing exercises with calculated relevance scores
-- GAA exercises get higher scores for power and agility focused exercises
UPDATE sport_exercises
SET relevance_score = CASE
    WHEN category IN ('Power & Agility', 'Core Stability') THEN 5
    WHEN category IN ('Flexibility', 'Lower Body Strength') THEN 4
    WHEN category IN ('Upper Body Strength', 'Balance & Coordination') THEN 3
    ELSE 3
END
WHERE sport = 'gaa';

-- Soccer exercises get higher scores for leg and core focused exercises
UPDATE sport_exercises
SET relevance_score = CASE
    WHEN category IN ('Lower Body Strength', 'Core Stability') THEN 5
    WHEN category IN ('Flexibility', 'Power & Agility') THEN 4
    WHEN category IN ('Upper Body Strength', 'Balance & Coordination') THEN 3
    ELSE 3
END
WHERE sport = 'soccer';

-- Rugby exercises get higher scores for full body strength and power
UPDATE sport_exercises
SET relevance_score = CASE
    WHEN category IN ('Full Body Integration', 'Power & Agility') THEN 5
    WHEN category IN ('Core Stability', 'Upper Body Strength') THEN 4
    WHEN category IN ('Flexibility', 'Balance & Coordination') THEN 3
    ELSE 3
END
WHERE sport = 'rugby';

-- Add an index for faster sorting by relevance
CREATE INDEX IF NOT EXISTS idx_sport_exercises_relevance
ON sport_exercises(sport, relevance_score DESC);