-- ============================================================================
-- Standardize muscle group names in movement_muscles table
-- Date: March 16, 2026
--
-- This migration fixes inconsistencies between muscle_groups (canonical) and
-- movement_muscles (actual usage) tables. All muscle group names will match
-- the canonical muscle_groups table exactly.
-- ============================================================================

-- First, let's see what we're changing (for verification)
SELECT 'BEFORE: Inconsistent muscle group names' as status;
SELECT DISTINCT muscle_group_name, COUNT(*) as usage_count
FROM movement_muscles
WHERE muscle_group_name NOT IN (SELECT name FROM muscle_groups)
GROUP BY muscle_group_name
ORDER BY muscle_group_name;

-- ============================================================================
-- STEP 1: Update all case-sensitivity issues and exact name matches
-- ============================================================================

BEGIN;

-- Core Strength (29 occurrences)
UPDATE movement_muscles
SET muscle_group_name = 'Core Strength'
WHERE muscle_group_name = 'Core strength';

-- Chest Stretch
UPDATE movement_muscles
SET muscle_group_name = 'Chest Stretch'
WHERE muscle_group_name = 'Chest stretch';

-- Erector Spinae Stretch
UPDATE movement_muscles
SET muscle_group_name = 'Erector Spinae Stretch'
WHERE muscle_group_name = 'Erector Spinae stretch';

-- Glute Strength
UPDATE movement_muscles
SET muscle_group_name = 'Glute Strength'
WHERE muscle_group_name = 'Glute strength';

-- Hamstring Strength
UPDATE movement_muscles
SET muscle_group_name = 'Hamstring Strength'
WHERE muscle_group_name = 'Hamstring strength';

-- Hamstring Stretch
UPDATE movement_muscles
SET muscle_group_name = 'Hamstring Stretch'
WHERE muscle_group_name = 'Hamstring stretch';

-- Hip Flexor Strengthening
UPDATE movement_muscles
SET muscle_group_name = 'Hip Flexor Strengthening'
WHERE muscle_group_name = 'Hip flexor strengthening';

-- Lower Back Stretch
UPDATE movement_muscles
SET muscle_group_name = 'Lower Back Stretch'
WHERE muscle_group_name = 'Lower back stretch';

-- Sequential Control
UPDATE movement_muscles
SET muscle_group_name = 'Sequential Control'
WHERE muscle_group_name = 'Sequential control';

-- Shoulder Mobility
UPDATE movement_muscles
SET muscle_group_name = 'Shoulder Mobility'
WHERE muscle_group_name = 'Shoulder mobility';

-- Spinal Mobility
UPDATE movement_muscles
SET muscle_group_name = 'Spinal Mobility'
WHERE muscle_group_name = 'Spinal mobility';

-- Spinal Stability
UPDATE movement_muscles
SET muscle_group_name = 'Spinal Stability'
WHERE muscle_group_name = 'Spinal stability';

-- Thigh Stretch
UPDATE movement_muscles
SET muscle_group_name = 'Thigh Stretch'
WHERE muscle_group_name = 'Thigh stretch';

-- Upper Body Strength
UPDATE movement_muscles
SET muscle_group_name = 'Upper Body Strength'
WHERE muscle_group_name = 'Upper body strength';

-- ============================================================================
-- STEP 2: Fix special cases with different formatting
-- ============================================================================

-- Hip Mobility and/or Strengthening (fix spacing: "and/ or" -> "and/or")
UPDATE movement_muscles
SET muscle_group_name = 'Hip Mobility and/or Strengthening'
WHERE muscle_group_name = 'Hip mobility and/ or strengthening';

-- Thoracic Mobility &/or Strength (fix spacing: "&/ or" -> "&/or", and case)
UPDATE movement_muscles
SET muscle_group_name = 'Thoracic Mobility &/or Strength'
WHERE muscle_group_name = 'Thoracic mobility &/ or strength';

-- Posterior Chain Strength (remove the parenthetical description)
UPDATE movement_muscles
SET muscle_group_name = 'Posterior Chain Strength'
WHERE muscle_group_name = 'Posterior chain strength (glutes & spinal extensors)';

COMMIT;

-- ============================================================================
-- VERIFICATION: Check that all muscle groups now match canonical names
-- ============================================================================

SELECT 'AFTER: All muscle groups should now match canonical names' as status;

-- This should return 0 rows if everything is fixed
SELECT DISTINCT mm.muscle_group_name as non_matching_name, COUNT(*) as occurrences
FROM movement_muscles mm
WHERE mm.muscle_group_name NOT IN (SELECT name FROM muscle_groups)
GROUP BY mm.muscle_group_name;

-- Show the standardized muscle groups and their usage counts
SELECT mm.muscle_group_name, COUNT(*) as movement_count
FROM movement_muscles mm
JOIN muscle_groups mg ON mm.muscle_group_name = mg.name
GROUP BY mm.muscle_group_name
ORDER BY COUNT(*) DESC;

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================
/*
-- To rollback these changes, you would need to reverse each update.
-- This is not recommended as it would restore the inconsistent state.
-- However, here are the reverse operations:

BEGIN;

UPDATE movement_muscles SET muscle_group_name = 'Core strength' WHERE muscle_group_name = 'Core Strength';
UPDATE movement_muscles SET muscle_group_name = 'Chest stretch' WHERE muscle_group_name = 'Chest Stretch';
UPDATE movement_muscles SET muscle_group_name = 'Erector Spinae stretch' WHERE muscle_group_name = 'Erector Spinae Stretch';
UPDATE movement_muscles SET muscle_group_name = 'Glute strength' WHERE muscle_group_name = 'Glute Strength';
UPDATE movement_muscles SET muscle_group_name = 'Hamstring strength' WHERE muscle_group_name = 'Hamstring Strength';
UPDATE movement_muscles SET muscle_group_name = 'Hamstring stretch' WHERE muscle_group_name = 'Hamstring Stretch';
UPDATE movement_muscles SET muscle_group_name = 'Hip flexor strengthening' WHERE muscle_group_name = 'Hip Flexor Strengthening';
UPDATE movement_muscles SET muscle_group_name = 'Lower back stretch' WHERE muscle_group_name = 'Lower Back Stretch';
UPDATE movement_muscles SET muscle_group_name = 'Sequential control' WHERE muscle_group_name = 'Sequential Control';
UPDATE movement_muscles SET muscle_group_name = 'Shoulder mobility' WHERE muscle_group_name = 'Shoulder Mobility';
UPDATE movement_muscles SET muscle_group_name = 'Spinal mobility' WHERE muscle_group_name = 'Spinal Mobility';
UPDATE movement_muscles SET muscle_group_name = 'Spinal stability' WHERE muscle_group_name = 'Spinal Stability';
UPDATE movement_muscles SET muscle_group_name = 'Thigh stretch' WHERE muscle_group_name = 'Thigh Stretch';
UPDATE movement_muscles SET muscle_group_name = 'Upper body strength' WHERE muscle_group_name = 'Upper Body Strength';
UPDATE movement_muscles SET muscle_group_name = 'Hip mobility and/ or strengthening' WHERE muscle_group_name = 'Hip Mobility and/or Strengthening';
UPDATE movement_muscles SET muscle_group_name = 'Thoracic mobility &/ or strength' WHERE muscle_group_name = 'Thoracic Mobility &/or Strength';
UPDATE movement_muscles SET muscle_group_name = 'Posterior chain strength (glutes & spinal extensors)' WHERE muscle_group_name = 'Posterior Chain Strength';

COMMIT;
*/