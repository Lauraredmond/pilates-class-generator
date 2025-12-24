-- ============================================================================
-- Standalone Script: Add Standing Position Transitions
-- ============================================================================
-- Purpose: Add missing transitions to/from Standing position
-- Created: December 24, 2025
-- Usage: Copy-paste this entire script into Supabase SQL Editor
-- ============================================================================

-- Standing to Standing (reset/preparation)
INSERT INTO transitions (from_position, to_position, narrative) VALUES
('Standing', 'Standing', 'Reset your stance, stack the spine tall over the hips, and prepare for the next movement with your shoulders relaxed.')
ON CONFLICT (from_position, to_position) DO UPDATE
    SET narrative = EXCLUDED.narrative;

-- Standing to Supine (standing to lying on back)
INSERT INTO transitions (from_position, to_position, narrative) VALUES
('Standing', 'Supine', 'Bend your knees with control, lower yourself down through a seated position, then roll down onto your back vertebra by vertebra.')
ON CONFLICT (from_position, to_position) DO UPDATE
    SET narrative = EXCLUDED.narrative;

-- Standing to Side-lying
INSERT INTO transitions (from_position, to_position, narrative) VALUES
('Standing', 'Side-lying', 'Lower yourself down with control, coming through a seated position, then carefully roll onto your side, stacking shoulders and hips.')
ON CONFLICT (from_position, to_position) DO UPDATE
    SET narrative = EXCLUDED.narrative;

-- Standing to Seated
INSERT INTO transitions (from_position, to_position, narrative) VALUES
('Standing', 'Seated', 'Lower down with control, bringing yourself smoothly into a tall seated position with the spine stacked and shoulders relaxed.')
ON CONFLICT (from_position, to_position) DO UPDATE
    SET narrative = EXCLUDED.narrative;

-- Standing to Prone (standing to lying on stomach)
INSERT INTO transitions (from_position, to_position, narrative) VALUES
('Standing', 'Prone', 'Fold forward with control, lower yourself down through the hands and knees, then extend fully onto your front with the spine long.')
ON CONFLICT (from_position, to_position) DO UPDATE
    SET narrative = EXCLUDED.narrative;

-- Standing to Kneeling
INSERT INTO transitions (from_position, to_position, narrative) VALUES
('Standing', 'Kneeling', 'Lower one knee at a time to the mat with control, stack the spine tall over the hips, and settle into a stable kneeling position.')
ON CONFLICT (from_position, to_position) DO UPDATE
    SET narrative = EXCLUDED.narrative;

-- Supine to Standing (lying on back to standing)
INSERT INTO transitions (from_position, to_position, narrative) VALUES
('Supine', 'Standing', 'Roll onto your side, press up through your hands, come through kneeling or seated, and carefully rise to standing with control.')
ON CONFLICT (from_position, to_position) DO UPDATE
    SET narrative = EXCLUDED.narrative;

-- Side-lying to Standing
INSERT INTO transitions (from_position, to_position, narrative) VALUES
('Side-lying', 'Standing', 'Roll onto your back or front with control, press up through the hands, come through seated or kneeling, and rise to standing.')
ON CONFLICT (from_position, to_position) DO UPDATE
    SET narrative = EXCLUDED.narrative;

-- Seated to Standing
INSERT INTO transitions (from_position, to_position, narrative) VALUES
('Seated', 'Standing', 'Shift your weight forward, bring your feet underneath you, and press through the legs to rise smoothly to standing with the spine tall.')
ON CONFLICT (from_position, to_position) DO UPDATE
    SET narrative = EXCLUDED.narrative;

-- Prone to Standing (lying on stomach to standing)
INSERT INTO transitions (from_position, to_position, narrative) VALUES
('Prone', 'Standing', 'Press up through your hands, come through kneeling, and carefully rise to standing one leg at a time with control and stability.')
ON CONFLICT (from_position, to_position) DO UPDATE
    SET narrative = EXCLUDED.narrative;

-- Kneeling to Standing
INSERT INTO transitions (from_position, to_position, narrative) VALUES
('Kneeling', 'Standing', 'Step one foot forward, press through the legs, and rise to standing with control, stacking the spine tall and shoulders relaxed.')
ON CONFLICT (from_position, to_position) DO UPDATE
    SET narrative = EXCLUDED.narrative;

-- ============================================================================
-- Verification Query (run this after to confirm)
-- ============================================================================
SELECT
    from_position,
    to_position,
    LEFT(narrative, 80) || '...' as narrative_preview,
    created_at
FROM transitions
WHERE from_position = 'Standing' OR to_position = 'Standing'
ORDER BY from_position, to_position;

-- Expected result: 11 rows showing all Standing transitions
