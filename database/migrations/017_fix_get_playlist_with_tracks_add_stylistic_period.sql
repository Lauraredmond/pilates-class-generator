-- Migration 017: Fix get_playlist_with_tracks to include track_stylistic_period
-- Created: 2025-12-04
-- Purpose: Add missing track_stylistic_period column to function output

-- This fixes the 500 error when fetching playlist details
-- Previously, the function didn't return stylistic_period, causing the backend
-- to hardcode all tracks as BAROQUE

DROP FUNCTION IF EXISTS get_playlist_with_tracks(UUID);

CREATE OR REPLACE FUNCTION get_playlist_with_tracks(playlist_uuid UUID)
RETURNS TABLE (
    playlist_id UUID,
    playlist_name VARCHAR(500),
    playlist_description TEXT,
    track_id UUID,
    track_title VARCHAR(500),
    track_composer VARCHAR(255),
    track_performer VARCHAR(255),
    track_duration_seconds INTEGER,
    track_audio_url TEXT,
    track_stylistic_period stylistic_period,  -- ADDED: Return track's stylistic period
    track_bpm INTEGER,
    sequence_order INTEGER,
    start_offset_seconds INTEGER,
    end_offset_seconds INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        mp.id AS playlist_id,
        mp.name AS playlist_name,
        mp.description AS playlist_description,
        mt.id AS track_id,
        mt.title AS track_title,
        mt.composer AS track_composer,
        mt.artist_performer AS track_performer,
        mt.duration_seconds AS track_duration_seconds,
        mt.audio_url AS track_audio_url,
        mt.stylistic_period AS track_stylistic_period,  -- ADDED: Include stylistic period
        mt.bpm AS track_bpm,
        mpt.sequence_order,
        mpt.start_offset_seconds,
        mpt.end_offset_seconds
    FROM music_playlists mp
    INNER JOIN music_playlist_tracks mpt ON mp.id = mpt.playlist_id
    INNER JOIN music_tracks mt ON mpt.track_id = mt.id
    WHERE mp.id = playlist_uuid
      AND mp.is_active = TRUE
      AND mt.is_active = TRUE
    ORDER BY mpt.sequence_order;
END;
$$ LANGUAGE plpgsql;

-- Verification query (run after migration):
-- SELECT * FROM get_playlist_with_tracks('be99b827-9b7e-4e47-a643-2eece3e06e59'::UUID);
-- Should now include track_stylistic_period column
