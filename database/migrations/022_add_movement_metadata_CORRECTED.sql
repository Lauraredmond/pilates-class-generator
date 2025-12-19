-- Migration 022 (CORRECTED): Add movement metadata columns (modifications, tips, movement_family)
-- Date: 2025-12-19
-- Purpose: Enhance class planning with movement families and additional teaching metadata

-- 1. Add three new columns to movements table
ALTER TABLE movements
ADD COLUMN IF NOT EXISTS modifications TEXT,
ADD COLUMN IF NOT EXISTS tips TEXT,
ADD COLUMN IF NOT EXISTS movement_family VARCHAR(50);

-- 2. Add CHECK constraint for movement_family (must be one of 7 valid families)
-- First drop constraint if it exists (in case of re-run)
ALTER TABLE movements DROP CONSTRAINT IF EXISTS movements_family_check;

ALTER TABLE movements
ADD CONSTRAINT movements_family_check
CHECK (movement_family IN (
    'rolling',
    'supine_abdominal',
    'inversion',
    'back_extension',
    'hip_extensor',
    'side_lying',
    'other'
) OR movement_family IS NULL);

-- 3. Add movement_family to movement_usage table for historical tracking
ALTER TABLE movement_usage
ADD COLUMN IF NOT EXISTS movement_family VARCHAR(50);

-- 4. Create indexes on movement_family for faster filtering
DROP INDEX IF EXISTS idx_movements_family;
DROP INDEX IF EXISTS idx_movement_usage_family;

CREATE INDEX idx_movements_family ON movements(movement_family);
CREATE INDEX idx_movement_usage_family ON movement_usage(movement_family);

-- 5. Add movement family balance rule to sequence_rules table
-- Based on actual schema seen in Supabase (columns: rule_number, description, rule_type,
-- is_required, enforcement_level, created_at, parameter_key, value_numeric, value_unit,
-- effectivity_level, business_rationale, last_changed_updated_at)

-- First, find the next available rule_number
DO $$
DECLARE
    next_rule_num INTEGER;
BEGIN
    -- Get the max rule_number and add 1
    SELECT COALESCE(MAX(rule_number), 0) + 1 INTO next_rule_num FROM sequence_rules;

    -- Insert the movement family balance rule
    INSERT INTO sequence_rules (
        rule_number,
        description,
        rule_type,
        is_required,
        enforcement_level,
        created_at,
        parameter_key,
        value_numeric,
        value_unit,
        effectivity_level,
        business_rationale,
        last_changed_updated_at
    )
    VALUES (
        next_rule_num,
        'No single movement family should exceed 40% of total movements in a class. This ensures variety and balanced training across different movement patterns.',
        'diversity',
        true,  -- Required rule
        'strict',  -- Enforcement level
        NOW(),  -- Created timestamp
        'max_family_percentage',  -- Parameter key
        40,  -- 40% threshold
        'percent',  -- Unit (percentage threshold)
        'quality',  -- Effectivity level
        'Ensures variety and balanced training across different movement patterns (rolling, supine_abdominal, inversion, back_extension, hip_extensor, side_lying, other). Prevents repetitive strain and promotes comprehensive body conditioning.',
        NOW()  -- Last changed timestamp
    );

    RAISE NOTICE 'Inserted movement family balance rule with rule_number %', next_rule_num;
END $$;

-- Verification query
SELECT
    'movements' as table_name,
    COUNT(*) as total_rows,
    COUNT(modifications) as has_modifications,
    COUNT(tips) as has_tips,
    COUNT(movement_family) as has_family
FROM movements
UNION ALL
SELECT
    'movement_usage',
    COUNT(*),
    NULL,
    NULL,
    COUNT(movement_family)
FROM movement_usage
UNION ALL
SELECT
    'sequence_rules',
    COUNT(*),
    NULL,
    NULL,
    NULL
FROM sequence_rules
WHERE description LIKE '%movement family%';
