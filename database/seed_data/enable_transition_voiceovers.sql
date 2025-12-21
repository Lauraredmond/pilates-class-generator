-- ============================================================================
-- COMPLETE TRANSITION VOICEOVER SETUP
-- ============================================================================
-- Purpose: Enable voiceover support for all transitions
-- Dependencies: Migration 027 must be run first (adds voiceover columns)
-- ============================================================================

-- STEP 1: Verify Migration 027 columns exist (should return 3 rows)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'transitions'
AND column_name LIKE 'voiceover%'
ORDER BY ordinal_position;

-- If above query returns 0 rows, run migration 027 first:
-- See: database/migrations/027_add_voiceover_columns_to_transitions.sql


-- ============================================================================
-- STEP 2: UPDATE VOICEOVER URLs (from 11. Audio folder)
-- ============================================================================
-- Base URL: https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/
-- Filenames use exact capitalization from uploaded files

-- Kneeling transitions
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Kneeling_to_kneeling.mp3' WHERE from_position = 'Kneeling' AND to_position = 'Kneeling';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Kneeling_to_Supine.mp3' WHERE from_position = 'Kneeling' AND to_position = 'Supine';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Kneeling_to_prone.mp3' WHERE from_position = 'Kneeling' AND to_position = 'Prone';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Kneeling_to_seated.mp3' WHERE from_position = 'Kneeling' AND to_position = 'Seated';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Kneeling_to_SideLying.mp3' WHERE from_position = 'Kneeling' AND to_position = 'Side-lying';

-- Supine transitions
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Supine_to_kneeling.mp3' WHERE from_position = 'Supine' AND to_position = 'Kneeling';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Supine_to_supine.mp3' WHERE from_position = 'Supine' AND to_position = 'Supine';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Supine_to_prone.mp3' WHERE from_position = 'Supine' AND to_position = 'Prone';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Supine_to_seated.mp3' WHERE from_position = 'Supine' AND to_position = 'Seated';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Supine_to_sideLying.mp3' WHERE from_position = 'Supine' AND to_position = 'Side-lying';

-- Prone transitions
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Prone_to_supine.mp3' WHERE from_position = 'Prone' AND to_position = 'Supine';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Prone_to_kneeling.mp3' WHERE from_position = 'Prone' AND to_position = 'Kneeling';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Prone_to_seated.mp3' WHERE from_position = 'Prone' AND to_position = 'Seated';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Prone_to_prone.mp3' WHERE from_position = 'Prone' AND to_position = 'Prone';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Prone_to_SideLying.mp3' WHERE from_position = 'Prone' AND to_position = 'Side-lying';

-- Seated transitions
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Seated_to_supine.mp3' WHERE from_position = 'Seated' AND to_position = 'Supine';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Seated_to_kneeling.mp3' WHERE from_position = 'Seated' AND to_position = 'Kneeling';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Seated_to_prone.mp3' WHERE from_position = 'Seated' AND to_position = 'Prone';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Seated_to_seated.mp3' WHERE from_position = 'Seated' AND to_position = 'Seated';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.Seated_to_SideLying.mp3' WHERE from_position = 'Seated' AND to_position = 'Side-lying';

-- Side-lying transitions (NOTE: filenames use "SideLying" not "Side-lying")
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.SideLying_to_Supine.mp3' WHERE from_position = 'Side-lying' AND to_position = 'Supine';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.SideLying_to_SideLying.mp3' WHERE from_position = 'Side-lying' AND to_position = 'Side-lying';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.SideLying_to_Seated.mp3' WHERE from_position = 'Side-lying' AND to_position = 'Seated';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.SideLying_to_Prone.mp3' WHERE from_position = 'Side-lying' AND to_position = 'Prone';
UPDATE transitions SET voiceover_url = 'https://lixvcebtwusmaipodcpc.supabase.co/storage/v1/object/public/movement-voiceovers/T.SideLying_to_Kneeling.mp3' WHERE from_position = 'Side-lying' AND to_position = 'Kneeling';


-- ============================================================================
-- STEP 3: ENABLE VOICEOVERS (set voiceover_enabled = true for all)
-- ============================================================================
UPDATE transitions
SET voiceover_enabled = true
WHERE voiceover_url IS NOT NULL;


-- ============================================================================
-- STEP 4: VERIFICATION QUERIES
-- ============================================================================

-- Check all transitions have voiceover URLs
SELECT
  from_position,
  to_position,
  CASE
    WHEN voiceover_url IS NOT NULL THEN '✓ Has URL'
    ELSE '✗ Missing URL'
  END AS url_status,
  voiceover_enabled,
  LEFT(voiceover_url, 80) as url_preview
FROM transitions
ORDER BY from_position, to_position;

-- Count enabled vs disabled
SELECT
  COUNT(*) FILTER (WHERE voiceover_enabled = true) as enabled_count,
  COUNT(*) FILTER (WHERE voiceover_enabled = false OR voiceover_enabled IS NULL) as disabled_count,
  COUNT(*) as total_transitions
FROM transitions;

-- Expected result:
-- enabled_count: 25 (all transitions)
-- disabled_count: 0
-- total_transitions: 25
