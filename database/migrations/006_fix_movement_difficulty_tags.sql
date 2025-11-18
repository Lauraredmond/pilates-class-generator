-- Migration 006: Fix Movement Difficulty Tags
-- Corrects incorrectly tagged movements to match classical Pilates progression
-- Based on CLAUDE.md domain knowledge

-- ISSUE-003: Wrong difficulty movements appearing in beginner sequences
-- Root cause: Database has incorrect difficulty_level tags

-- ============================================================================
-- INTERMEDIATE MOVEMENTS (incorrectly tagged as Beginner)
-- ============================================================================

UPDATE movements
SET difficulty_level = 'Intermediate'
WHERE name IN (
    'Neck pull',
    'Neck Pull',
    'Scissors',
    'Bicycle (& Scissors)',
    'Bicycle'
)
AND difficulty_level = 'Beginner';

-- ============================================================================
-- ADVANCED MOVEMENTS (incorrectly tagged as Beginner)
-- ============================================================================

UPDATE movements
SET difficulty_level = 'Advanced'
WHERE name IN (
    'Swimming',
    'Leg pull supine',
    'Leg Pull Supine',
    'Leg Pull Back'
)
AND difficulty_level = 'Beginner';

-- ============================================================================
-- VERIFICATION QUERIES (run these after migration to confirm)
-- ============================================================================

-- Should return 0 rows (no more wrong tags)
-- SELECT name, difficulty_level
-- FROM movements
-- WHERE name IN ('Swimming', 'Neck pull', 'Scissors', 'Bicycle (& Scissors)', 'Leg pull supine')
-- AND difficulty_level = 'Beginner';

-- Should show correct counts:
-- Beginner: ~14 movements
-- Intermediate: ~10 movements
-- Advanced: ~10 movements
-- SELECT difficulty_level, COUNT(*)
-- FROM movements
-- GROUP BY difficulty_level
-- ORDER BY CASE
--     WHEN difficulty_level = 'Beginner' THEN 1
--     WHEN difficulty_level = 'Intermediate' THEN 2
--     WHEN difficulty_level = 'Advanced' THEN 3
-- END;

COMMENT ON TABLE movements IS 'Classical Pilates movements with corrected difficulty levels (Migration 006)';
