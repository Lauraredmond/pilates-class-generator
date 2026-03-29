-- Migration: Populate intensity_score and class_phase for all movements
-- Based on research from classical Pilates order and biomechanical demands
-- Date: 2026-03-29

-- WARM-UP PHASE (intensity_score 1-3)
UPDATE movements SET intensity_score = 3, class_phase = 'warm_up' WHERE name = 'The Hundred';
UPDATE movements SET intensity_score = 2, class_phase = 'warm_up' WHERE name = 'Rolling back';
UPDATE movements SET intensity_score = 3, class_phase = 'warm_up' WHERE name = 'One leg circle';
UPDATE movements SET intensity_score = 2, class_phase = 'warm_up' WHERE name = 'Spine stretch';
UPDATE movements SET intensity_score = 3, class_phase = 'warm_up' WHERE name = 'The Saw';
UPDATE movements SET intensity_score = 3, class_phase = 'warm_up' WHERE name = 'Spine twist';
UPDATE movements SET intensity_score = 3, class_phase = 'cool_down' WHERE name = 'The Seal';

-- EARLY-MIDDLE PHASE (intensity_score 4-6)
UPDATE movements SET intensity_score = 4, class_phase = 'early_middle' WHERE name = 'The Roll Up';
UPDATE movements SET intensity_score = 4, class_phase = 'early_middle' WHERE name = 'One leg stretch';
UPDATE movements SET intensity_score = 5, class_phase = 'early_middle' WHERE name = 'Double leg stretch';
UPDATE movements SET intensity_score = 6, class_phase = 'early_middle' WHERE name = 'Bicycle (& Scissors)';
UPDATE movements SET intensity_score = 6, class_phase = 'early_middle' WHERE name = 'Scissors';
UPDATE movements SET intensity_score = 4, class_phase = 'early_middle' WHERE name = 'One leg kick';
UPDATE movements SET intensity_score = 6, class_phase = 'early_middle' WHERE name = 'Double leg kick';
UPDATE movements SET intensity_score = 5, class_phase = 'early_middle' WHERE name = 'Neck pull';
UPDATE movements SET intensity_score = 5, class_phase = 'early_middle' WHERE name = 'Shoulder Bridge';
UPDATE movements SET intensity_score = 4, class_phase = 'early_middle' WHERE name = 'Side kick';
UPDATE movements SET intensity_score = 6, class_phase = 'early_middle' WHERE name = 'Swimming - Prone';
UPDATE movements SET intensity_score = 6, class_phase = 'early_middle' WHERE name = 'Swimming - Box';
UPDATE movements SET intensity_score = 6, class_phase = 'early_middle' WHERE name = 'Side kick kneeling';
UPDATE movements SET intensity_score = 6, class_phase = 'early_middle' WHERE name = 'Side bend';
UPDATE movements SET intensity_score = 5, class_phase = 'early_middle' WHERE name = 'Push up';

-- PEAK PHASE (intensity_score 7-10)
UPDATE movements SET intensity_score = 7, class_phase = 'peak' WHERE name = 'Rocker with Open legs';
UPDATE movements SET intensity_score = 7, class_phase = 'peak' WHERE name = 'The Corkscrew';
UPDATE movements SET intensity_score = 8, class_phase = 'peak' WHERE name = 'The Swan Dive';
UPDATE movements SET intensity_score = 9, class_phase = 'peak' WHERE name = 'Jack knife';
UPDATE movements SET intensity_score = 9, class_phase = 'peak' WHERE name = 'Teaser';
UPDATE movements SET intensity_score = 8, class_phase = 'peak' WHERE name = 'Hip twist';
UPDATE movements SET intensity_score = 7, class_phase = 'peak' WHERE name = 'Leg pull prone';
UPDATE movements SET intensity_score = 7, class_phase = 'peak' WHERE name = 'Leg pull supine';
UPDATE movements SET intensity_score = 9, class_phase = 'peak' WHERE name = 'Boomerang';
UPDATE movements SET intensity_score = 7, class_phase = 'peak' WHERE name = 'The Crab';
UPDATE movements SET intensity_score = 8, class_phase = 'peak' WHERE name = 'Rocking';
UPDATE movements SET intensity_score = 10, class_phase = 'peak' WHERE name = 'Control balance';
UPDATE movements SET intensity_score = 8, class_phase = 'peak' WHERE name = 'The Roll Over';

-- Verification query
SELECT name, intensity_score, class_phase, difficulty_level, setup_position
FROM movements
ORDER BY intensity_score, name;
