-- Migration 016b: Insert Jazz Music Data
-- Created: 2025-12-04
-- Purpose: Insert Jazz track, playlists, and linkages
-- PREREQUISITE: Migration 016a must be run first and committed!

-- =============================================================================
-- INSERT JAZZ TRACK FROM INTERNET ARCHIVE
-- =============================================================================

-- Insert 1-hour relaxing jazz coffee shop music track
INSERT INTO music_tracks (
    source,
    provider_track_id,
    provider_url,
    title,
    composer,
    artist_performer,
    duration_seconds,
    bpm,
    stylistic_period,
    mood_tags,
    audio_url,
    license_info,
    is_active,
    quality_score
) VALUES (
    'MUSOPEN',  -- Using MUSOPEN as generic "internet archive" source
    '1-hour-relaxing-jazz-coffee-shop-music-the-best-melodies-that-will-warm-your-heart',
    'https://archive.org/details/1-hour-relaxing-jazz-coffee-shop-music-the-best-melodies-that-will-warm-your-heart',
    '1 Hour Relaxing Jazz Coffee Shop Music - The Best Melodies That Will Warm Your Heart',
    'Various Artists',
    'jaguar101',
    3600,  -- 1 hour = 3600 seconds
    90,    -- Estimated BPM for relaxing jazz
    'JAZZ',
    ARRAY['relaxing', 'coffee shop', 'smooth', 'warm', 'gentle', 'instrumental'],
    'https://archive.org/download/1-hour-relaxing-jazz-coffee-shop-music-the-best-melodies-that-will-warm-your-heart/1%20Hour%20Relaxing%20Jazz%20Coffee%20Shop%20Music%20%20The%20Best%20Melodies%20That%20Will%20Warm%20Your%20Heart.mp3',
    '{"type": "Public Domain", "attribution": "Internet Archive - jaguar101", "source": "archive.org", "uploaded": "2024-05-21"}',
    true,
    0.85  -- High quality score
);

-- =============================================================================
-- CREATE JAZZ PLAYLISTS
-- =============================================================================

-- Jazz Playlist for General Pilates Classes (Low Intensity)
INSERT INTO music_playlists (
    name,
    description,
    intended_intensity,
    intended_use,
    stylistic_period,
    duration_minutes_target,
    is_active,
    is_featured
) VALUES (
    'Relaxing Jazz for Pilates',
    'Smooth, gentle jazz perfect for slow-flow Pilates classes. Creates a warm, sophisticated atmosphere.',
    'LOW',
    'PILATES_SLOW_FLOW',
    'JAZZ',
    60,
    true,
    true  -- Featured playlist
);

-- Jazz Playlist for Core Work (Medium Intensity)
INSERT INTO music_playlists (
    name,
    description,
    intended_intensity,
    intended_use,
    stylistic_period,
    duration_minutes_target,
    is_active,
    is_featured
) VALUES (
    'Jazz for Core Strengthening',
    'Upbeat jazz melodies to maintain focus and energy during core-intensive Pilates work.',
    'MEDIUM',
    'PILATES_CORE',
    'JAZZ',
    60,
    true,
    false
);

-- Jazz Playlist for Stretching (Low Intensity)
INSERT INTO music_playlists (
    name,
    description,
    intended_intensity,
    intended_use,
    stylistic_period,
    duration_minutes_target,
    is_active,
    is_featured
) VALUES (
    'Jazz for Stretching & Cool-Down',
    'Gentle jazz to accompany deep stretching and relaxation at the end of class.',
    'LOW',
    'PILATES_STRETCH',
    'JAZZ',
    15,
    true,
    false
);

-- =============================================================================
-- LINK JAZZ TRACK TO PLAYLISTS
-- =============================================================================

-- Get the track ID for the jazz track we just inserted
DO $$
DECLARE
    jazz_track_id UUID;
    jazz_slow_flow_playlist_id UUID;
    jazz_core_playlist_id UUID;
    jazz_stretch_playlist_id UUID;
BEGIN
    -- Get track ID
    SELECT id INTO jazz_track_id
    FROM music_tracks
    WHERE title = '1 Hour Relaxing Jazz Coffee Shop Music - The Best Melodies That Will Warm Your Heart';

    -- Get playlist IDs
    SELECT id INTO jazz_slow_flow_playlist_id
    FROM music_playlists
    WHERE name = 'Relaxing Jazz for Pilates';

    SELECT id INTO jazz_core_playlist_id
    FROM music_playlists
    WHERE name = 'Jazz for Core Strengthening';

    SELECT id INTO jazz_stretch_playlist_id
    FROM music_playlists
    WHERE name = 'Jazz for Stretching & Cool-Down';

    -- Link track to slow flow playlist (full 60 minutes)
    INSERT INTO music_playlist_tracks (playlist_id, track_id, sequence_order, start_offset_seconds, end_offset_seconds)
    VALUES (jazz_slow_flow_playlist_id, jazz_track_id, 0, 0, 3600);

    -- Link track to core playlist (full 60 minutes)
    INSERT INTO music_playlist_tracks (playlist_id, track_id, sequence_order, start_offset_seconds, end_offset_seconds)
    VALUES (jazz_core_playlist_id, jazz_track_id, 0, 0, 3600);

    -- Link track to stretch playlist (first 15 minutes only)
    INSERT INTO music_playlist_tracks (playlist_id, track_id, sequence_order, start_offset_seconds, end_offset_seconds)
    VALUES (jazz_stretch_playlist_id, jazz_track_id, 0, 0, 900);  -- 15 minutes = 900 seconds
END $$;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check Jazz track inserted
SELECT id, title, stylistic_period, duration_seconds, audio_url
FROM music_tracks
WHERE stylistic_period = 'JAZZ';

-- Check Jazz playlists created
SELECT id, name, intended_intensity, intended_use, stylistic_period
FROM music_playlists
WHERE stylistic_period = 'JAZZ';

-- Check playlist-track linkage
SELECT
    mp.name AS playlist_name,
    mt.title AS track_title,
    mpt.start_offset_seconds,
    mpt.end_offset_seconds,
    (mpt.end_offset_seconds - mpt.start_offset_seconds) / 60 AS duration_minutes
FROM music_playlist_tracks mpt
JOIN music_playlists mp ON mpt.playlist_id = mp.id
JOIN music_tracks mt ON mpt.track_id = mt.id
WHERE mp.stylistic_period = 'JAZZ';

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TYPE stylistic_period IS 'Musical stylistic periods for Pilates class music selection. Now includes JAZZ (added 2025-12-04).';
