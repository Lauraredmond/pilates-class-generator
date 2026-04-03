-- Copy Production Schema to Dev
-- Run this in PRODUCTION Supabase → SQL Editor to generate export
-- Then copy the output and run in DEV Supabase

-- ============================================
-- PART 1: Run this in PRODUCTION to get the schema
-- ============================================

-- This generates a complete schema dump
-- Copy the results and run them in DEV

SELECT
    'CREATE TABLE IF NOT EXISTS ' || tablename || ' AS TABLE ' || schemaname || '.' || tablename || ' WITH NO DATA;' AS create_statement
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- After running above, you'll get CREATE statements
-- Copy those and run in DEV

-- ============================================
-- Alternative: Manual table list
-- If above doesn't work, copy these CREATE TABLE statements from production
-- ============================================

-- You can also just view each table structure in production:
-- 1. Go to Production → Database → Tables
-- 2. Click each table
-- 3. Click "..." → "View SQL"
-- 4. Copy the CREATE TABLE statement
-- 5. Paste in Dev → SQL Editor

-- Tables to copy (in this order due to dependencies):
-- 1. movements
-- 2. music_tracks
-- 3. music_playlists
-- 4. music_playlist_tracks
-- 5. preparation_scripts
-- 6. warmup_routines
-- 7. cooldown_sequences
-- 8. closing_meditation_scripts
-- 9. closing_homecare_advice
-- 10. class_plans
-- 11. user_profiles
-- 12. user_preferences
-- (and any other tables you have)
