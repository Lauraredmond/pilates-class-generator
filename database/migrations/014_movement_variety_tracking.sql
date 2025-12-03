-- Migration 014: Movement Variety Tracking & The Hundred Boosting
-- Session: Section 3 Main Movements Enhancement
-- Date: December 3, 2025
-- Purpose: Enable movement history tracking, variety scoring, and beginner support

-- ============================================
-- 1. ADD EXPERIENCE TRACKING TO USER PREFERENCES
-- ============================================

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50) DEFAULT 'beginner',
ADD COLUMN IF NOT EXISTS classes_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_class_date DATE,
ADD COLUMN IF NOT EXISTS preferred_movements UUID[] DEFAULT '{}';

COMMENT ON COLUMN user_preferences.experience_level IS 'User experience level: beginner, intermediate, advanced';
COMMENT ON COLUMN user_preferences.classes_completed IS 'Total number of classes completed by user';
COMMENT ON COLUMN user_preferences.first_class_date IS 'Date of first class to track progression';
COMMENT ON COLUMN user_preferences.preferred_movements IS 'Array of movement IDs user wants to practice more';

-- Add CHECK constraint for experience_level
ALTER TABLE user_preferences
DROP CONSTRAINT IF EXISTS check_experience_level,
ADD CONSTRAINT check_experience_level CHECK (experience_level IN ('beginner', 'intermediate', 'advanced'));

-- ============================================
-- 2. ADD MOVEMENT USAGE TRACKING TO CLASS_HISTORY
-- ============================================

-- Ensure movements_snapshot includes muscle groups for analytics
-- (Already exists from previous migration, but adding comment for clarity)
COMMENT ON COLUMN class_history.movements_snapshot IS 'JSONB array of movements with muscle groups for variety tracking and analytics';

-- ============================================
-- 3. CREATE FUNCTION TO GET MOVEMENT HISTORY FOR USER
-- ============================================

CREATE OR REPLACE FUNCTION get_user_movement_history(
    p_user_id UUID,
    p_lookback_days INTEGER DEFAULT 30,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
    movement_id UUID,
    movement_name VARCHAR,
    times_used INTEGER,
    last_used_date DATE,
    muscle_groups TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (movement->>'id')::UUID as movement_id,
        movement->>'name' as movement_name,
        COUNT(*)::INTEGER as times_used,
        MAX(ch.taught_date) as last_used_date,
        ARRAY_AGG(DISTINCT muscle_group) FILTER (WHERE muscle_group IS NOT NULL) as muscle_groups
    FROM class_history ch
    CROSS JOIN LATERAL jsonb_array_elements(ch.movements_snapshot) as movement
    CROSS JOIN LATERAL jsonb_array_elements_text((movement->'muscle_groups')::jsonb) as muscle_group
    WHERE
        ch.user_id = p_user_id
        AND ch.taught_date >= CURRENT_DATE - p_lookback_days
        AND movement->>'type' = 'movement'  -- Exclude transitions
    GROUP BY (movement->>'id')::UUID, movement->>'name'
    ORDER BY times_used DESC, last_used_date DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_movement_history IS 'Returns movement usage frequency for variety scoring (lookback default: 30 days, last 5 classes)';

-- ============================================
-- 4. CREATE FUNCTION TO CHECK CONSECUTIVE MUSCLE OVERUSE
-- ============================================

CREATE OR REPLACE FUNCTION check_consecutive_muscle_overuse(
    sequence_json JSONB
)
RETURNS TABLE(
    is_valid BOOLEAN,
    problem_index INTEGER,
    overused_muscle VARCHAR,
    validation_message TEXT
) AS $$
DECLARE
    sequence_length INT;
    i INT;
    current_muscles TEXT[];
    next_muscles TEXT[];
    overlap_count INT;
    current_count INT;
    overlap_pct DECIMAL;
BEGIN
    sequence_length := jsonb_array_length(sequence_json);

    -- Check consecutive movements for muscle overlap
    FOR i IN 0..(sequence_length - 2) LOOP
        -- Get muscle groups from current movement
        SELECT ARRAY(
            SELECT jsonb_array_elements_text((sequence_json->i->'primary_muscles')::jsonb)
        ) INTO current_muscles;

        -- Get muscle groups from next movement
        SELECT ARRAY(
            SELECT jsonb_array_elements_text((sequence_json->(i+1)->'primary_muscles')::jsonb)
        ) INTO next_muscles;

        -- Skip if either movement has no muscles defined
        IF current_muscles IS NULL OR next_muscles IS NULL OR
           array_length(current_muscles, 1) IS NULL OR array_length(next_muscles, 1) IS NULL THEN
            CONTINUE;
        END IF;

        -- Count overlap
        SELECT COUNT(*) INTO overlap_count
        FROM unnest(current_muscles) as muscle
        WHERE muscle = ANY(next_muscles);

        current_count := array_length(current_muscles, 1);

        -- Calculate overlap percentage
        IF current_count > 0 THEN
            overlap_pct := (overlap_count::DECIMAL / current_count::DECIMAL);

            -- If >60% overlap, flag as overuse
            IF overlap_pct > 0.60 THEN
                RETURN QUERY SELECT
                    false,
                    i,
                    current_muscles[1],  -- Return first overlapping muscle
                    format(
                        'Movements %s and %s share %s%% muscle overlap (>60%% threshold)',
                        sequence_json->i->>'name',
                        sequence_json->(i+1)->>'name',
                        ROUND(overlap_pct * 100)
                    )::TEXT;
                RETURN;  -- Stop at first violation
            END IF;
        END IF;
    END LOOP;

    -- If we get here, no violations found
    RETURN QUERY SELECT
        true,
        NULL::INTEGER,
        NULL::VARCHAR,
        'No consecutive muscle overuse detected'::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_consecutive_muscle_overuse IS 'Validates that consecutive movements do not overuse same muscle groups (>60% overlap threshold)';

-- ============================================
-- 5. CREATE FUNCTION TO CALCULATE NOVELTY SCORE
-- ============================================

CREATE OR REPLACE FUNCTION calculate_movement_novelty_score(
    p_user_id UUID,
    p_movement_id UUID,
    p_lookback_days INTEGER DEFAULT 30
)
RETURNS DECIMAL AS $$
DECLARE
    times_used INT;
    days_since_last_use INT;
    novelty_score DECIMAL;
BEGIN
    -- Get usage count and recency
    SELECT
        COUNT(*)::INT,
        COALESCE(CURRENT_DATE - MAX(ch.taught_date), 999) as days_since
    INTO times_used, days_since_last_use
    FROM class_history ch
    CROSS JOIN LATERAL jsonb_array_elements(ch.movements_snapshot) as movement
    WHERE
        ch.user_id = p_user_id
        AND (movement->>'id')::UUID = p_movement_id
        AND ch.taught_date >= CURRENT_DATE - p_lookback_days;

    -- Calculate novelty score (0.0 = frequently used, 1.0 = never used)
    -- Formula: (days_since_last_use / lookback_days) * (1 - (times_used / 10))
    -- Cap times_used at 10 for scoring purposes
    novelty_score := (LEAST(days_since_last_use, p_lookback_days)::DECIMAL / p_lookback_days::DECIMAL)
                   * (1.0 - LEAST(times_used, 10)::DECIMAL / 10.0);

    RETURN novelty_score;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_movement_novelty_score IS 'Calculates novelty score for movement (0.0 = overused, 1.0 = novel). Factors: recency and frequency.';

-- ============================================
-- 6. CREATE INDEX FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_class_history_user_date ON class_history(user_id, taught_date DESC);
CREATE INDEX IF NOT EXISTS idx_class_history_movements_snapshot ON class_history USING GIN (movements_snapshot);
CREATE INDEX IF NOT EXISTS idx_user_preferences_experience ON user_preferences(experience_level);
CREATE INDEX IF NOT EXISTS idx_user_preferences_classes_completed ON user_preferences(classes_completed);

-- ============================================
-- 7. UPDATE EXISTING USERS WITH DEFAULT VALUES
-- ============================================

-- Set experience level based on classes completed (if class_history exists)
UPDATE user_preferences up
SET
    experience_level = CASE
        WHEN classes_completed < 10 THEN 'beginner'
        WHEN classes_completed < 50 THEN 'intermediate'
        ELSE 'advanced'
    END,
    first_class_date = COALESCE(
        (SELECT MIN(taught_date) FROM class_history WHERE user_id = up.user_id),
        CURRENT_DATE
    )
WHERE experience_level IS NULL OR first_class_date IS NULL;

-- ============================================
-- 8. VERIFICATION AND SUCCESS MESSAGE
-- ============================================

DO $$
DECLARE
    user_count INT;
    history_count INT;
BEGIN
    SELECT COUNT(*) INTO user_count FROM user_preferences WHERE experience_level IS NOT NULL;
    SELECT COUNT(DISTINCT user_id) INTO history_count FROM class_history;

    RAISE NOTICE '';
    RAISE NOTICE '✅ Migration 014 Complete: Movement Variety Tracking Enabled!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 User Experience Tracking:';
    RAISE NOTICE '  - Users with experience level: %', user_count;
    RAISE NOTICE '  - Users with class history: %', history_count;
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Features Added:';
    RAISE NOTICE '  • experience_level field (beginner/intermediate/advanced)';
    RAISE NOTICE '  • classes_completed counter';
    RAISE NOTICE '  • first_class_date tracking';
    RAISE NOTICE '  • preferred_movements array';
    RAISE NOTICE '  • get_user_movement_history() function (30-day lookback)';
    RAISE NOTICE '  • check_consecutive_muscle_overuse() function (60%% threshold)';
    RAISE NOTICE '  • calculate_movement_novelty_score() function (0.0-1.0 scale)';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Next Steps:';
    RAISE NOTICE '  1. Update sequence generation to query movement history';
    RAISE NOTICE '  2. Implement novelty scoring in movement selection (70%% novel, 30%% practice)';
    RAISE NOTICE '  3. Add "The Hundred" boosting for beginners (3x weight)';
    RAISE NOTICE '  4. Add consecutive muscle overuse validation to sequencing';
    RAISE NOTICE '';
END $$;
