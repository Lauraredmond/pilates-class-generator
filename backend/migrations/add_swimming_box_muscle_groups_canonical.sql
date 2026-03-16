-- ============================================================================
-- Add muscle groups for Swimming Box movement (CANONICAL NAMES)
-- Date: March 16, 2026
--
-- IMPORTANT: This migration must be run AFTER standardize_muscle_group_names.sql
-- Uses only canonical muscle group names from the muscle_groups table
-- ============================================================================

-- Movement ID: 4b13e7b5-d008-4341-aa08-5a0d17042f86 (Swimming - Box)

-- Clear any existing muscle groups for Swimming Box (in case of partial inserts)
DELETE FROM movement_muscles
WHERE movement_id = '4b13e7b5-d008-4341-aa08-5a0d17042f86';

-- Insert muscle groups using CANONICAL names from muscle_groups table
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

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify all muscle groups exist in canonical table
SELECT 'Verifying muscle groups match canonical names:' as check_type;
SELECT mm.muscle_group_name,
       CASE WHEN mg.name IS NOT NULL THEN 'VALID' ELSE 'INVALID' END as status
FROM movement_muscles mm
LEFT JOIN muscle_groups mg ON mm.muscle_group_name = mg.name
WHERE mm.movement_id = '4b13e7b5-d008-4341-aa08-5a0d17042f86'
ORDER BY mm.muscle_group_name;

-- Show final Swimming Box muscle groups
SELECT 'Final Swimming Box muscle groups:' as result_type;
SELECT
    m.name as movement_name,
    mm.muscle_group_name
FROM movements m
JOIN movement_muscles mm ON m.id = mm.movement_id
WHERE m.id = '4b13e7b5-d008-4341-aa08-5a0d17042f86'
ORDER BY mm.muscle_group_name;

-- Compare with Swimming - Prone for consistency
SELECT 'Comparison with Swimming - Prone:' as comparison;
SELECT
    m.name,
    mm.muscle_group_name
FROM movements m
JOIN movement_muscles mm ON m.id = mm.movement_id
WHERE LOWER(m.name) LIKE '%swimming%'
ORDER BY m.name, mm.muscle_group_name;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
/*
DELETE FROM movement_muscles
WHERE movement_id = '4b13e7b5-d008-4341-aa08-5a0d17042f86';
*/

-- ============================================================================
-- CANONICAL MUSCLE GROUPS USED
-- ============================================================================
-- All muscle group names in this migration are the exact canonical names
-- from the muscle_groups table after standardization:
--
-- 1. Posterior Chain Strength - for back extension
-- 2. Core Strength - for trunk stability
-- 3. Hip Mobility and/or Strengthening - for hip movement patterns
-- 4. Glute Strength - for hip extension power
-- 5. Hamstring Strength - for hip extension assistance
-- 6. Scapular Stability - for upper body control
-- 7. Shoulder Mobility - for arm movement patterns
-- 8. Coordination - for cross-pattern movement
-- 9. Thoracic Mobility &/or Strength - for mid-back mobility
-- 10. Pelvic Stability - for pelvis control during movement