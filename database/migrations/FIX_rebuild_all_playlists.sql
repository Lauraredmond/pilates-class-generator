-- FIXED Playlist Rebuild - Rebuild all playlists with current tracks
-- This script rebuilds music_playlist_tracks to include ALL currently active tracks
-- for each stylistic period, regardless of when the playlist was initially created.
--
-- Run this in Supabase SQL Editor after confirming tracks exist in music_tracks table

-- =============================================================================
-- STEP 1: Clear ALL existing playlist-track associations
-- =============================================================================

DELETE FROM music_playlist_tracks;

-- =============================================================================
-- STEP 2: Rebuild playlists using stylistic_period instead of hardcoded names
-- =============================================================================
-- This approach is more robust because it doesn't depend on exact playlist names

-- ROMANTIC playlists
INSERT INTO music_playlist_tracks (playlist_id, track_id, sequence_order)
SELECT
    p.id as playlist_id,
    t.id as track_id,
    (ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY t.bpm, t.title) - 1) as sequence_order
FROM music_playlists p
CROSS JOIN music_tracks t
WHERE p.stylistic_period = 'ROMANTIC'
  AND p.is_active = true
  AND t.stylistic_period = 'ROMANTIC'
  AND t.is_active = true
ORDER BY p.id, t.bpm, t.title;

-- BAROQUE playlists
INSERT INTO music_playlist_tracks (playlist_id, track_id, sequence_order)
SELECT
    p.id as playlist_id,
    t.id as track_id,
    (ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY t.bpm, t.title) - 1) as sequence_order
FROM music_playlists p
CROSS JOIN music_tracks t
WHERE p.stylistic_period = 'BAROQUE'
  AND p.is_active = true
  AND t.stylistic_period = 'BAROQUE'
  AND t.is_active = true
ORDER BY p.id, t.bpm, t.title;

-- CLASSICAL playlists
INSERT INTO music_playlist_tracks (playlist_id, track_id, sequence_order)
SELECT
    p.id as playlist_id,
    t.id as track_id,
    (ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY t.bpm, t.title) - 1) as sequence_order
FROM music_playlists p
CROSS JOIN music_tracks t
WHERE p.stylistic_period = 'CLASSICAL'
  AND p.is_active = true
  AND t.stylistic_period = 'CLASSICAL'
  AND t.is_active = true
ORDER BY p.id, t.bpm, t.title;

-- IMPRESSIONIST playlists
INSERT INTO music_playlist_tracks (playlist_id, track_id, sequence_order)
SELECT
    p.id as playlist_id,
    t.id as track_id,
    (ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY t.bpm, t.title) - 1) as sequence_order
FROM music_playlists p
CROSS JOIN music_tracks t
WHERE p.stylistic_period = 'IMPRESSIONIST'
  AND p.is_active = true
  AND t.stylistic_period = 'IMPRESSIONIST'
  AND t.is_active = true
ORDER BY p.id, t.bpm, t.title;

-- MODERN playlists
INSERT INTO music_playlist_tracks (playlist_id, track_id, sequence_order)
SELECT
    p.id as playlist_id,
    t.id as track_id,
    (ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY t.bpm, t.title) - 1) as sequence_order
FROM music_playlists p
CROSS JOIN music_tracks t
WHERE p.stylistic_period = 'MODERN'
  AND p.is_active = true
  AND t.stylistic_period = 'MODERN'
  AND t.is_active = true
ORDER BY p.id, t.bpm, t.title;

-- CONTEMPORARY playlists
INSERT INTO music_playlist_tracks (playlist_id, track_id, sequence_order)
SELECT
    p.id as playlist_id,
    t.id as track_id,
    (ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY t.bpm, t.title) - 1) as sequence_order
FROM music_playlists p
CROSS JOIN music_tracks t
WHERE p.stylistic_period = 'CONTEMPORARY'
  AND p.is_active = true
  AND t.stylistic_period = 'CONTEMPORARY'
  AND t.is_active = true
ORDER BY p.id, t.bpm, t.title;

-- CELTIC_TRADITIONAL playlists
INSERT INTO music_playlist_tracks (playlist_id, track_id, sequence_order)
SELECT
    p.id as playlist_id,
    t.id as track_id,
    (ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY t.bpm, t.title) - 1) as sequence_order
FROM music_playlists p
CROSS JOIN music_tracks t
WHERE p.stylistic_period = 'CELTIC_TRADITIONAL'
  AND p.is_active = true
  AND t.stylistic_period = 'CELTIC_TRADITIONAL'
  AND t.is_active = true
ORDER BY p.id, t.bpm, t.title;

-- Handle MIXED playlists (if any exist)
-- These playlists may intentionally mix multiple periods
-- For now, we skip them - they can be manually curated
-- INSERT INTO music_playlist_tracks ...
-- WHERE p.stylistic_period = 'MIXED'

-- =============================================================================
-- STEP 3: Verification Queries
-- =============================================================================

-- Count tracks per playlist
SELECT
    p.name as playlist_name,
    p.stylistic_period,
    COUNT(pt.track_id) as track_count
FROM music_playlists p
LEFT JOIN music_playlist_tracks pt ON p.id = pt.playlist_id
WHERE p.is_active = true
GROUP BY p.id, p.name, p.stylistic_period
ORDER BY p.stylistic_period, p.name;

-- Check for any NULL playlist_ids (should be 0)
SELECT COUNT(*) as null_playlist_ids
FROM music_playlist_tracks
WHERE playlist_id IS NULL;

-- =============================================================================
-- NOTES
-- =============================================================================
--
-- This approach is better than the previous version because:
-- 1. It doesn't depend on exact playlist names
-- 2. It uses CROSS JOIN to associate ALL tracks of a period with ALL playlists of that period
-- 3. It uses PARTITION BY to ensure each playlist gets correct sequence_order starting from 0
-- 4. It handles future tracks automatically (just re-run this script when new tracks added)
--
-- Key differences from previous version:
-- - CROSS JOIN music_tracks instead of subquery for playlist_id
-- - ROW_NUMBER() OVER (PARTITION BY p.id ...) to generate sequence per playlist
-- - No hardcoded playlist names
--
