-- Migration 022: Add movement metadata columns (modifications, tips, movement_family)
-- Date: 2025-12-19
-- Purpose: Enhance class planning with movement families and additional teaching metadata

-- 1. Add three new columns to movements table
ALTER TABLE movements
ADD COLUMN modifications TEXT,
ADD COLUMN tips TEXT,
ADD COLUMN movement_family VARCHAR(50);

-- 2. Add CHECK constraint for movement_family (must be one of 7 valid families)
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
));

-- 3. Add movement_family to movement_usage table for historical tracking
ALTER TABLE movement_usage
ADD COLUMN movement_family VARCHAR(50);

-- 4. Create index on movement_family for faster filtering
CREATE INDEX idx_movements_family ON movements(movement_family);
CREATE INDEX idx_movement_usage_family ON movement_usage(movement_family);

-- 5. Add new sequence rule for movement family distribution
INSERT INTO sequence_rules (rule_name, rule_type, description, severity, parameters)
VALUES (
    'movement_family_balance',
    'diversity',
    'No single movement family should exceed 40% of total movements in a class. This ensures variety and balanced training across different movement patterns.',
    'warning',  -- Start as warning, can become error if needed
    '{
        "max_family_percentage": 40,
        "enforcement": "soft",
        "fallback_behavior": "allow_with_warning"
    }'::jsonb
);

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
FROM movement_usage;
