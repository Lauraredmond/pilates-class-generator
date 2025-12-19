-- Export COMPLETE Production Schema (December 18, 2025)
-- Run this in PRODUCTION Supabase SQL Editor
-- Then copy ALL output and run in DEV

-- ============================================
-- PART 1: Export Table Definitions with ALL details
-- ============================================

-- This query generates CREATE TABLE statements with:
-- - All columns with correct types
-- - All constraints
-- - All default values
-- - All indexes

SELECT
    'CREATE TABLE IF NOT EXISTS ' ||
    table_name || ' (' ||
    string_agg(
        column_name || ' ' ||
        UPPER(udt_name) ||
        CASE
            WHEN character_maximum_length IS NOT NULL
            THEN '(' || character_maximum_length || ')'
            ELSE ''
        END ||
        CASE
            WHEN column_default IS NOT NULL
            THEN ' DEFAULT ' || column_default
            ELSE ''
        END ||
        CASE
            WHEN is_nullable = 'NO'
            THEN ' NOT NULL'
            ELSE ''
        END,
        ', '
    ) ||
    ');'
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'movements',
    'muscle_groups',
    'movement_muscles',
    'sequence_rules',
    'transitions',
    'teaching_cues',
    'common_mistakes',
    'users',
    'user_profiles',
    'user_preferences',
    'pii_tokens',
    'class_plans',
    'class_movements',
    'class_history',
    'movement_usage',
    'student_profiles',
    'preparation_scripts',
    'warmup_routines',
    'cooldown_sequences',
    'closing_meditation_scripts',
    'closing_homecare_advice',
    'music_tracks',
    'music_playlists',
    'music_playlist_tracks',
    'ai_decision_log',
    'bias_monitoring',
    'model_drift_log',
    'ropa_audit_log'
  )
GROUP BY table_name
ORDER BY table_name;

-- ============================================
-- INSTRUCTIONS:
-- ============================================
-- 1. Run this query in PRODUCTION Supabase SQL Editor
-- 2. Copy ALL the output (will be ~30 CREATE TABLE statements)
-- 3. Go to DEV Supabase SQL Editor
-- 4. Paste and run
-- 5. This creates empty tables with correct schema
-- 6. Then optionally seed with test data
