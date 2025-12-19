-- Migration 022 (FIXED): Add movement metadata columns (modifications, tips, movement_family)
-- Date: 2025-12-19
-- Purpose: Enhance class planning with movement families and additional teaching metadata
-- NOTE: This version skips sequence_rules insertion to avoid schema conflicts

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
) OR movement_family IS NULL);  -- Allow NULL for movements not yet classified

-- 3. Add movement_family to movement_usage table for historical tracking
ALTER TABLE movement_usage
ADD COLUMN IF NOT EXISTS movement_family VARCHAR(50);

-- 4. Create indexes on movement_family for faster filtering
DROP INDEX IF EXISTS idx_movements_family;
DROP INDEX IF EXISTS idx_movement_usage_family;

CREATE INDEX idx_movements_family ON movements(movement_family);
CREATE INDEX idx_movement_usage_family ON movement_usage(movement_family);

-- 5. NOTE: Sequence rule enforcement happens in backend code (sequence_tools.py)
--    MAX_FAMILY_PERCENTAGE = 40% is enforced during sequence generation
--    We're NOT adding to sequence_rules table to avoid schema conflicts

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
