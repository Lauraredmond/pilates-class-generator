-- FIX: Update section duration_seconds to correct values
-- Issue: Modal showing 32m instead of ~27-29m for 30-min class
-- Root cause: warmup_routines and possibly other tables have incorrect duration_seconds

-- 1. Fix warmup_routines (should be ~180s = 3 minutes)
UPDATE warmup_routines
SET duration_seconds = 180
WHERE duration_seconds != 180;

-- 2. Fix preparation_scripts (should be ~240s = 4 minutes)
UPDATE preparation_scripts
SET duration_seconds = 240
WHERE duration_seconds != 240;

-- 3. Fix cooldown_sequences (should be ~180s = 3 minutes)
UPDATE cooldown_sequences
SET duration_seconds = 180
WHERE duration_seconds != 180;

-- 4. Fix closing_meditation_scripts (should be ~240s = 4 minutes)
UPDATE closing_meditation_scripts
SET duration_seconds = 240
WHERE duration_seconds != 240;

-- 5. Fix closing_homecare_advice (should be ~60s = 1 minute)
UPDATE closing_homecare_advice
SET duration_seconds = 60
WHERE duration_seconds != 60;

-- Verify the updates
SELECT 'preparation_scripts' as table_name, COUNT(*) as rows, AVG(duration_seconds) as avg_duration
FROM preparation_scripts
UNION ALL
SELECT 'warmup_routines', COUNT(*), AVG(duration_seconds)
FROM warmup_routines
UNION ALL
SELECT 'cooldown_sequences', COUNT(*), AVG(duration_seconds)
FROM cooldown_sequences
UNION ALL
SELECT 'closing_meditation_scripts', COUNT(*), AVG(duration_seconds)
FROM closing_meditation_scripts
UNION ALL
SELECT 'closing_homecare_advice', COUNT(*), AVG(duration_seconds)
FROM closing_homecare_advice;
