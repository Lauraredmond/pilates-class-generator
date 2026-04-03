-- Migration 013: Fix Ambiguous Column Reference in cooldown function
-- Date: December 3, 2025
-- Issue: Parameter name 'target_muscles' conflicts with table column name

-- Drop and recreate the function with renamed parameter
DROP FUNCTION IF EXISTS select_cooldown_by_muscle_groups(TEXT[], VARCHAR);

CREATE OR REPLACE FUNCTION select_cooldown_by_muscle_groups(
    p_target_muscles TEXT[],  -- Renamed parameter to avoid ambiguity
    user_mode VARCHAR DEFAULT 'default'
)
RETURNS TABLE(
    sequence_id UUID,
    sequence_name VARCHAR,
    narrative TEXT,
    stretches JSONB,
    duration_seconds INTEGER
) AS $$
BEGIN
    IF user_mode = 'reasoner' THEN
        RETURN QUERY
        SELECT
            id,
            cooldown_sequences.sequence_name,
            cooldown_sequences.narrative,
            cooldown_sequences.stretches,
            cooldown_sequences.duration_seconds
        FROM cooldown_sequences
        WHERE
            required_muscle_groups && p_target_muscles  -- Use renamed parameter
            AND allow_ai_generation = true
        ORDER BY
            (SELECT count(*) FROM unnest(required_muscle_groups) WHERE unnest = ANY(p_target_muscles)) DESC
        LIMIT 1;
    ELSE
        RETURN QUERY
        SELECT
            id,
            cooldown_sequences.sequence_name,
            cooldown_sequences.narrative,
            cooldown_sequences.stretches,
            cooldown_sequences.duration_seconds
        FROM cooldown_sequences
        WHERE required_muscle_groups && p_target_muscles  -- Use renamed parameter
        ORDER BY
            (SELECT count(*) FROM unnest(required_muscle_groups) WHERE unnest = ANY(p_target_muscles)) DESC
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION select_cooldown_by_muscle_groups IS 'Selects appropriate cool-down sequence based on muscle groups and user mode (default vs reasoner) - Fixed ambiguous column reference';

-- Verification
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 013 Complete: Fixed ambiguous column reference in select_cooldown_by_muscle_groups()';
    RAISE NOTICE '   Parameter renamed from target_muscles to p_target_muscles';
END $$;
