-- ============================================================================
-- COMPLETE MUSCLE GROUP FIX MIGRATION
-- Date: March 16, 2026
--
-- This migration:
-- 1. Standardizes all muscle group names to match canonical muscle_groups table
-- 2. Adds Swimming Box muscle groups with correct canonical names
-- ============================================================================

-- Show what we're fixing
SELECT 'BEFORE: Non-canonical muscle group names' as status;
SELECT DISTINCT muscle_group_name, COUNT(*) as usage_count
FROM movement_muscles
WHERE muscle_group_name NOT IN (SELECT name FROM muscle_groups)
GROUP BY muscle_group_name
ORDER BY muscle_group_name;

-- ============================================================================
-- PART 1: STANDARDIZE ALL EXISTING MUSCLE GROUP NAMES
-- ============================================================================

BEGIN;

-- Fix case-sensitivity issues
UPDATE movement_muscles SET muscle_group_name = 'Core Strength' WHERE muscle_group_name = 'Core strength';
UPDATE movement_muscles SET muscle_group_name = 'Chest Stretch' WHERE muscle_group_name = 'Chest stretch';
UPDATE movement_muscles SET muscle_group_name = 'Erector Spinae Stretch' WHERE muscle_group_name = 'Erector Spinae stretch';
UPDATE movement_muscles SET muscle_group_name = 'Glute Strength' WHERE muscle_group_name = 'Glute strength';
UPDATE movement_muscles SET muscle_group_name = 'Hamstring Strength' WHERE muscle_group_name = 'Hamstring strength';
UPDATE movement_muscles SET muscle_group_name = 'Hamstring Stretch' WHERE muscle_group_name = 'Hamstring stretch';
UPDATE movement_muscles SET muscle_group_name = 'Hip Flexor Strengthening' WHERE muscle_group_name = 'Hip flexor strengthening';
UPDATE movement_muscles SET muscle_group_name = 'Lower Back Stretch' WHERE muscle_group_name = 'Lower back stretch';
UPDATE movement_muscles SET muscle_group_name = 'Sequential Control' WHERE muscle_group_name = 'Sequential control';
UPDATE movement_muscles SET muscle_group_name = 'Shoulder Mobility' WHERE muscle_group_name = 'Shoulder mobility';
UPDATE movement_muscles SET muscle_group_name = 'Spinal Mobility' WHERE muscle_group_name = 'Spinal mobility';
UPDATE movement_muscles SET muscle_group_name = 'Spinal Stability' WHERE muscle_group_name = 'Spinal stability';
UPDATE movement_muscles SET muscle_group_name = 'Thigh Stretch' WHERE muscle_group_name = 'Thigh stretch';
UPDATE movement_muscles SET muscle_group_name = 'Upper Body Strength' WHERE muscle_group_name = 'Upper body strength';

-- Fix special formatting issues
UPDATE movement_muscles SET muscle_group_name = 'Hip Mobility and/or Strengthening'
WHERE muscle_group_name = 'Hip mobility and/ or strengthening';

UPDATE movement_muscles SET muscle_group_name = 'Thoracic Mobility &/or Strength'
WHERE muscle_group_name = 'Thoracic mobility &/ or strength';

UPDATE movement_muscles SET muscle_group_name = 'Posterior Chain Strength'
WHERE muscle_group_name = 'Posterior chain strength (glutes & spinal extensors)';

COMMIT;

-- ============================================================================
-- PART 2: ADD SWIMMING BOX MUSCLE GROUPS WITH CANONICAL NAMES
-- ============================================================================

BEGIN;

-- Clear any existing muscle groups for Swimming Box
DELETE FROM movement_muscles
WHERE movement_id = '4b13e7b5-d008-4341-aa08-5a0d17042f86';

-- Insert muscle groups using canonical names
INSERT INTO movement_muscles (movement_id, muscle_group_name) VALUES
    ('4b13e7b5-d008-4341-aa08-5a0d17042f86', 'Posterior Chain Strength'),
    ('4b13e7b5-d008-4341-aa08-5a0d17042f86', 'Core Strength'),
    ('4b13e7b5-d008-4341-aa08-5a0d17042f86', 'Hip Mobility and/or Strengthening'),
    ('4b13e7b5-d008-4341-aa08-5a0d17042f86', 'Glute Strength'),
    ('4b13e7b5-d008-4341-aa08-5a0d17042f86', 'Hamstring Strength'),
    ('4b13e7b5-d008-4341-aa08-5a0d17042f86', 'Scapular Stability'),
    ('4b13e7b5-d008-4341-aa08-5a0d17042f86', 'Shoulder Mobility'),
    ('4b13e7b5-d008-4341-aa08-5a0d17042f86', 'Coordination'),
    ('4b13e7b5-d008-4341-aa08-5a0d17042f86', 'Thoracic Mobility &/or Strength'),
    ('4b13e7b5-d008-4341-aa08-5a0d17042f86', 'Pelvic Stability');

COMMIT;

-- ============================================================================
-- VERIFICATION: Check all muscle groups now match canonical names
-- ============================================================================

SELECT 'AFTER: Checking for any non-canonical names (should be 0)' as status;
SELECT COUNT(DISTINCT mm.muscle_group_name) as non_canonical_count
FROM movement_muscles mm
WHERE mm.muscle_group_name NOT IN (SELECT name FROM muscle_groups);

-- List any remaining non-canonical names (should be empty)
SELECT DISTINCT mm.muscle_group_name as non_canonical_names
FROM movement_muscles mm
WHERE mm.muscle_group_name NOT IN (SELECT name FROM muscle_groups);

-- Show Swimming Box muscle groups
SELECT 'Swimming Box muscle groups added:' as status;
SELECT m.name as movement_name, mm.muscle_group_name
FROM movements m
JOIN movement_muscles mm ON m.id = mm.movement_id
WHERE m.id = '4b13e7b5-d008-4341-aa08-5a0d17042f86'
ORDER BY mm.muscle_group_name;

-- Summary of all standardized muscle groups
SELECT 'Summary of all muscle groups after migration:' as status;
SELECT mm.muscle_group_name, COUNT(*) as movement_count
FROM movement_muscles mm
JOIN muscle_groups mg ON mm.muscle_group_name = mg.name
GROUP BY mm.muscle_group_name
ORDER BY COUNT(*) DESC
LIMIT 20;