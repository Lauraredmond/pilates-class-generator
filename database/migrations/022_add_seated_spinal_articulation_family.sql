-- Add seated_spinal_articulation as a new movement family
-- Date: 2025-12-19
-- Purpose: Separate seated spinal work from generic "other" category

-- Step 1: Drop the existing CHECK constraint
ALTER TABLE movements DROP CONSTRAINT IF EXISTS movements_family_check;

-- Step 2: Recreate the CHECK constraint with the new family included (8 total families now)
ALTER TABLE movements
ADD CONSTRAINT movements_family_check
CHECK (movement_family IN (
    'rolling',
    'supine_abdominal',
    'inversion',
    'back_extension',
    'hip_extensor',
    'side_lying',
    'seated_spinal_articulation',  -- NEW FAMILY
    'other'
) OR movement_family IS NULL);

-- Step 3: Update movements to use the new family
UPDATE movements SET movement_family = 'seated_spinal_articulation' WHERE code IN (
    'the_saw',
    'spine_stretch',
    'spine_twist'
);

-- Verification: Show the updated movements
SELECT code, name, movement_family
FROM movements
WHERE movement_family = 'seated_spinal_articulation'
ORDER BY name;

-- Verification: Show all movement families distribution
SELECT
    movement_family,
    COUNT(*) as movement_count,
    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM movements WHERE movement_family IS NOT NULL)), 1) as percentage,
    string_agg(name, ', ' ORDER BY name) as movements
FROM movements
WHERE movement_family IS NOT NULL
GROUP BY movement_family
ORDER BY movement_count DESC;
