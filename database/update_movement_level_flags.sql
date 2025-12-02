-- ============================================================================
-- UPDATE MOVEMENT LEVEL FLAGS (Y/N) FOR ALL 34 MOVEMENTS
-- ============================================================================
-- Generated: December 2, 2025
-- Source: Movements_summaries.xlsx (Levels column)
-- Purpose: Populate level_1_description, level_2_description, level_3_description,
--          and full_version_description with Y or N flags
-- ============================================================================

-- Movement 1: The Hundred
-- Levels: L1, L2, FV
-- Flags: L1=Y, L2=Y, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'Y',
    level_2_description = 'Y',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 1;

-- Movement 2: The Roll Up
-- Levels: L1, L2, FV
-- Flags: L1=Y, L2=Y, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'Y',
    level_2_description = 'Y',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 2;

-- Movement 3: The Roll Over
-- Levels: L1, FV
-- Flags: L1=Y, L2=N, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'Y',
    level_2_description = 'N',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 3;

-- Movement 4: One leg circle
-- Levels: L1, L2, FV
-- Flags: L1=Y, L2=Y, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'Y',
    level_2_description = 'Y',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 4;

-- Movement 5: Rolling back
-- Levels: L1, L2, FV
-- Flags: L1=Y, L2=Y, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'Y',
    level_2_description = 'Y',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 5;

-- Movement 6: One leg stretch
-- Levels: L1, L2, L3, FV
-- Flags: L1=Y, L2=Y, L3=Y, FV=Y
UPDATE movements
SET level_1_description = 'Y',
    level_2_description = 'Y',
    level_3_description = 'Y',
    full_version_description = 'Y'
WHERE movement_number = 6;

-- Movement 7: Double leg stretch
-- Levels: L1, L2, L3, FV
-- Flags: L1=Y, L2=Y, L3=Y, FV=Y
UPDATE movements
SET level_1_description = 'Y',
    level_2_description = 'Y',
    level_3_description = 'Y',
    full_version_description = 'Y'
WHERE movement_number = 7;

-- Movement 8: Spine stretch
-- Levels: One level with modifications???
-- Flags: L1=N, L2=N, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'N',
    level_2_description = 'N',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 8;

-- Movement 9: Rocker with Open legs
-- Levels: One level with modifications???
-- Flags: L1=N, L2=N, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'N',
    level_2_description = 'N',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 9;

-- Movement 10: The Corkscrew
-- Levels: One
-- Flags: L1=N, L2=N, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'N',
    level_2_description = 'N',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 10;

-- Movement 11: The Saw
-- Levels: One level with modifications???
-- Flags: L1=N, L2=N, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'N',
    level_2_description = 'N',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 11;

-- Movement 12: The Swan Dive
-- Levels: L1, L2, FV
-- Flags: L1=Y, L2=Y, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'Y',
    level_2_description = 'Y',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 12;

-- Movement 13: One leg kick
-- Levels: One level with modifications???
-- Flags: L1=N, L2=N, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'N',
    level_2_description = 'N',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 13;

-- Movement 14: Double leg kick
-- Levels: One level with modifications???
-- Flags: L1=N, L2=N, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'N',
    level_2_description = 'N',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 14;

-- Movement 15: Neck pull
-- Levels: One level with modifications???
-- Flags: L1=N, L2=N, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'N',
    level_2_description = 'N',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 15;

-- Movement 16: Scissors
-- Levels: L1, L2, L3, FV
-- Flags: L1=Y, L2=Y, L3=Y, FV=Y
UPDATE movements
SET level_1_description = 'Y',
    level_2_description = 'Y',
    level_3_description = 'Y',
    full_version_description = 'Y'
WHERE movement_number = 16;

-- Movement 17: Bicycle (& Scissors)
-- Levels: One level with modifications???
-- Flags: L1=N, L2=N, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'N',
    level_2_description = 'N',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 17;

-- Movement 18: Shoulder Bridge
-- Levels: L1, L2, FV
-- Flags: L1=Y, L2=Y, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'Y',
    level_2_description = 'Y',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 18;

-- Movement 19: Spine twist
-- Levels: L1, FV
-- Flags: L1=Y, L2=N, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'Y',
    level_2_description = 'N',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 19;

-- Movement 20: Jack knife
-- Levels: One level with modifications???
-- Flags: L1=N, L2=N, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'N',
    level_2_description = 'N',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 20;

-- Movement 21: Side kick
-- Levels: L1, L2, FV
-- Flags: L1=Y, L2=Y, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'Y',
    level_2_description = 'Y',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 21;

-- Movement 22: Teaser
-- Levels: L1, L2, FV
-- Flags: L1=Y, L2=Y, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'Y',
    level_2_description = 'Y',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 22;

-- Movement 23: Hip twist
-- Levels: One level with modifications???
-- Flags: L1=N, L2=N, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'N',
    level_2_description = 'N',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 23;

-- Movement 24: Swimming
-- Levels: Prone: L1, L2, FV; Box: L1, L2, FV
-- Flags: L1=Y, L2=Y, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'Y',
    level_2_description = 'Y',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 24;

-- Movement 25: Leg pull prone
-- Levels: L1, L2, L3, FV
-- Flags: L1=Y, L2=Y, L3=Y, FV=Y
UPDATE movements
SET level_1_description = 'Y',
    level_2_description = 'Y',
    level_3_description = 'Y',
    full_version_description = 'Y'
WHERE movement_number = 25;

-- Movement 26: Leg pull supine
-- Levels: One level with modifications???
-- Flags: L1=N, L2=N, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'N',
    level_2_description = 'N',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 26;

-- Movement 27: Side kick kneeling
-- Levels: One level with modifications???
-- Flags: L1=N, L2=N, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'N',
    level_2_description = 'N',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 27;

-- Movement 28: Side bend
-- Levels: L1, L2, L3, FV
-- Flags: L1=Y, L2=Y, L3=Y, FV=Y
UPDATE movements
SET level_1_description = 'Y',
    level_2_description = 'Y',
    level_3_description = 'Y',
    full_version_description = 'Y'
WHERE movement_number = 28;

-- Movement 29: Boomerang
-- Levels: One level with modifications???
-- Flags: L1=N, L2=N, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'N',
    level_2_description = 'N',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 29;

-- Movement 30: The Seal
-- Levels: One level with modifications???
-- Flags: L1=N, L2=N, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'N',
    level_2_description = 'N',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 30;

-- Movement 31: The Crab
-- Levels: One level with modifications???
-- Flags: L1=N, L2=N, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'N',
    level_2_description = 'N',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 31;

-- Movement 32: Rocking
-- Levels: One level with modifications???
-- Flags: L1=N, L2=N, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'N',
    level_2_description = 'N',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 32;

-- Movement 33: Control balance
-- Levels: One level with modifications???
-- Flags: L1=N, L2=N, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'N',
    level_2_description = 'N',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 33;

-- Movement 34: Push up
-- Levels: L1, L2, FV
-- Flags: L1=Y, L2=Y, L3=N, FV=Y
UPDATE movements
SET level_1_description = 'Y',
    level_2_description = 'Y',
    level_3_description = 'N',
    full_version_description = 'Y'
WHERE movement_number = 34;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this after executing the updates to verify flags are populated:
--
-- SELECT movement_number, name,
--        level_1_description as L1,
--        level_2_description as L2,
--        level_3_description as L3,
--        full_version_description as FV
-- FROM movements
-- ORDER BY movement_number;

-- ============================================================================
-- SUMMARY STATISTICS
-- ============================================================================
-- Total movements: 34
-- Movements with Level 1: 17
-- Movements with Level 2: 15
-- Movements with Level 3: 5
-- Movements with Full Version: 34
-- ============================================================================
