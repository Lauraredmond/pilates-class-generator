-- Check the status of music tracks in the database
-- Run this in Supabase SQL Editor to diagnose the tracks_available: 0 issue

-- 1. Count all tracks
SELECT COUNT(*) as total_tracks FROM music_tracks;

-- 2. Count active vs inactive tracks
SELECT
    is_active,
    COUNT(*) as count
FROM music_tracks
GROUP BY is_active;

-- 3. Check tracks by source
SELECT
    source,
    is_active,
    COUNT(*) as count
FROM music_tracks
GROUP BY source, is_active
ORDER BY source, is_active;

-- 4. View sample of tracks with all relevant fields
SELECT
    id,
    title,
    composer,
    source,
    stylistic_period,
    is_active,
    created_at,
    LEFT(audio_url, 50) as audio_url_prefix
FROM music_tracks
ORDER BY created_at DESC
LIMIT 20;

-- 5. Check for duplicate tracks
SELECT
    title,
    composer,
    COUNT(*) as duplicate_count
FROM music_tracks
GROUP BY title, composer
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 6. Verify music_source enum values
SELECT
    enumlabel as source_value
FROM pg_enum
WHERE enumtypid = (
    SELECT oid
    FROM pg_type
    WHERE typname = 'music_source'
)
ORDER BY enumlabel;
