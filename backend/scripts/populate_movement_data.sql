-- Populate Movement Durations and Movement Patterns
-- All 34 Classical Pilates Movements
-- Session 7: Database Data Fix

-- First, add movement_pattern column if it doesn't exist
ALTER TABLE movements ADD COLUMN IF NOT EXISTS movement_pattern VARCHAR(50);

-- Update durations and movement patterns for all 34 classical Pilates movements
-- Beginner Level (1-14)

-- 1. The Hundred (100 breaths = 100 seconds)
UPDATE movements
SET duration_seconds = 100, movement_pattern = 'flexion'
WHERE name = 'The Hundred';

-- 2. The Roll Up
UPDATE movements
SET duration_seconds = 90, movement_pattern = 'flexion'
WHERE name = 'The Roll Up';

-- 3. The Roll Over
UPDATE movements
SET duration_seconds = 75, movement_pattern = 'flexion'
WHERE name = 'The Roll Over';

-- 4. One Leg Circle
UPDATE movements
SET duration_seconds = 120, movement_pattern = 'flexion'
WHERE name = 'One leg circle';

-- 5. Rolling Back (Rolling Like a Ball)
UPDATE movements
SET duration_seconds = 60, movement_pattern = 'flexion'
WHERE name = 'Rolling back';

-- 6. Single Leg Stretch
UPDATE movements
SET duration_seconds = 90, movement_pattern = 'flexion'
WHERE name = 'Single leg stretch';

-- 7. Double Leg Stretch
UPDATE movements
SET duration_seconds = 90, movement_pattern = 'flexion'
WHERE name = 'Double leg stretch';

-- 8. Spine Stretch Forward
UPDATE movements
SET duration_seconds = 120, movement_pattern = 'flexion'
WHERE name = 'Spine Stretch';

-- 9. Open Leg Rocker
UPDATE movements
SET duration_seconds = 75, movement_pattern = 'flexion'
WHERE name = 'Open leg rocker/closed leg rocker';

-- 10. Corkscrew
UPDATE movements
SET duration_seconds = 90, movement_pattern = 'rotation'
WHERE name = 'Corkscrew';

-- 11. The Saw
UPDATE movements
SET duration_seconds = 120, movement_pattern = 'rotation'
WHERE name = 'The Saw';

-- 12. Swan Dive
UPDATE movements
SET duration_seconds = 75, movement_pattern = 'extension'
WHERE name = 'Swan-dive';

-- 13. Single Leg Kick
UPDATE movements
SET duration_seconds = 90, movement_pattern = 'extension'
WHERE name = 'Single leg kick';

-- 14. Double Leg Kick
UPDATE movements
SET duration_seconds = 90, movement_pattern = 'extension'
WHERE name = 'Double leg kick';

-- Intermediate Level (15-24)

-- 15. Neck Pull
UPDATE movements
SET duration_seconds = 120, movement_pattern = 'flexion'
WHERE name = 'Neck pull';

-- 16. Scissors
UPDATE movements
SET duration_seconds = 90, movement_pattern = 'flexion'
WHERE name = 'Scissors';

-- 17. Bicycle
UPDATE movements
SET duration_seconds = 90, movement_pattern = 'flexion'
WHERE name = 'Bicycle';

-- 18. Shoulder Bridge
UPDATE movements
SET duration_seconds = 120, movement_pattern = 'extension'
WHERE name = 'Shoulder bridge';

-- 19. Spine Twist
UPDATE movements
SET duration_seconds = 90, movement_pattern = 'rotation'
WHERE name = 'Spine Twist';

-- 20. Jack Knife
UPDATE movements
SET duration_seconds = 75, movement_pattern = 'flexion'
WHERE name = 'Jack knife';

-- 21. Side Kick (Front/Back)
UPDATE movements
SET duration_seconds = 120, movement_pattern = 'lateral'
WHERE name = 'Side kick';

-- 22. Side Kick (Up/Down)
UPDATE movements
SET duration_seconds = 90, movement_pattern = 'lateral'
WHERE name = 'Side kick up and down';

-- 23. Side Kick (Circles)
UPDATE movements
SET duration_seconds = 90, movement_pattern = 'lateral'
WHERE name = 'Side kick circles';

-- 24. Teaser
UPDATE movements
SET duration_seconds = 90, movement_pattern = 'balance'
WHERE name = 'Teaser';

-- Advanced Level (25-34)

-- 25. Hip Twist (Can Can)
UPDATE movements
SET duration_seconds = 90, movement_pattern = 'rotation'
WHERE name = 'Can Can/Hip Twist';

-- 26. Swimming
UPDATE movements
SET duration_seconds = 90, movement_pattern = 'extension'
WHERE name = 'Swimming';

-- 27. Leg Pull Front
UPDATE movements
SET duration_seconds = 75, movement_pattern = 'extension'
WHERE name = 'Leg Pull Front';

-- 28. Leg Pull Back
UPDATE movements
SET duration_seconds = 75, movement_pattern = 'extension'
WHERE name = 'Leg pull';

-- 29. Side Bend (Mermaid)
UPDATE movements
SET duration_seconds = 90, movement_pattern = 'lateral'
WHERE name = 'Side Bend/Mermaid/Star';

-- 30. Boomerang
UPDATE movements
SET duration_seconds = 90, movement_pattern = 'balance'
WHERE name = 'Boomerang';

-- 31. Seal
UPDATE movements
SET duration_seconds = 60, movement_pattern = 'flexion'
WHERE name = 'Seal';

-- 32. Control Balance
UPDATE movements
SET duration_seconds = 90, movement_pattern = 'balance'
WHERE name = 'Control Balance';

-- 33. Push Up
UPDATE movements
SET duration_seconds = 75, movement_pattern = 'extension'
WHERE name = 'Push up';

-- 34. Rocking
UPDATE movements
SET duration_seconds = 75, movement_pattern = 'extension'
WHERE name = 'Rocking';

-- Verify updates
SELECT
    movement_number,
    name,
    duration_seconds,
    movement_pattern,
    difficulty_level
FROM movements
ORDER BY movement_number;
