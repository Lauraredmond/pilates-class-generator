-- =============================================================================
-- RESTORE MUSIC LIBRARY - Complete Solution
-- Created: 2025-12-12
-- Purpose: Restore missing playlists and ensure all stylistic periods have music
-- =============================================================================

-- Step 1: Check current state
SELECT 'Checking current music library...' as status;

SELECT
    stylistic_period,
    COUNT(*) as track_count
FROM music_tracks
WHERE is_active = true
GROUP BY stylistic_period
ORDER BY stylistic_period;

SELECT
    stylistic_period,
    COUNT(*) as playlist_count
FROM music_playlists
WHERE is_active = true
GROUP BY stylistic_period
ORDER BY stylistic_period;

-- Step 2: Delete placeholder data
DELETE FROM music_playlists WHERE name = '[DEV_FIXTURE] Sample Playlist';
DELETE FROM music_tracks WHERE title = '[DEV_FIXTURE] Bach Prelude Sample';

-- Step 3: Add basic tracks for all 7 periods (if they don't exist)
-- These are the original 14 tracks from Session 9

INSERT INTO music_tracks (source, title, composer, artist_performer, duration_seconds, bpm, stylistic_period, mood_tags, audio_url, license_info, quality_score, is_active)
SELECT
    v.source::music_source,
    v.title,
    v.composer,
    v.artist_performer,
    v.duration_seconds,
    v.bpm,
    v.stylistic_period::stylistic_period,
    v.mood_tags,
    v.audio_url,
    v.license_info,
    v.quality_score,
    v.is_active
FROM (VALUES
    -- IMPRESSIONIST
    ('INTERNET_ARCHIVE', 'Clair de Lune', 'Claude Debussy', 'Public Domain Recording', 300, 60, 'IMPRESSIONIST', ARRAY['dreamy', 'piano', 'impressionist', 'calm'], 'https://archive.org/download/ClairDeLuneSheet/Debussy-ClairDeLune.mp3', '{"type": "Public Domain", "attribution": "Internet Archive"}'::jsonb, 0.95, true),
    ('INTERNET_ARCHIVE', 'Arabesque No. 1', 'Claude Debussy', 'Public Domain Recording', 240, 65, 'IMPRESSIONIST', ARRAY['flowing', 'piano', 'elegant', 'light'], 'https://archive.org/download/DeArNo1/DeAr1.mp3', '{"type": "Public Domain", "attribution": "Internet Archive"}'::jsonb, 0.92, true),

    -- ROMANTIC
    ('INTERNET_ARCHIVE', 'Minute Waltz', 'Frédéric Chopin', 'Public Domain Recording', 120, 140, 'ROMANTIC', ARRAY['lively', 'piano', 'virtuosic', 'energetic'], 'https://archive.org/download/MinuteWaltzChopinPiano/minutewaltz.mp3', '{"type": "Public Domain", "attribution": "Internet Archive"}'::jsonb, 0.90, true),
    ('INTERNET_ARCHIVE', 'Nocturne Op. 9 No. 2', 'Frédéric Chopin', 'Public Domain Recording', 270, 55, 'ROMANTIC', ARRAY['nocturnal', 'piano', 'romantic', 'expressive'], 'https://archive.org/download/ChopinNocturneOp.9No.2/ChopinNocturneOp.9No.2.mp3', '{"type": "Public Domain", "attribution": "Internet Archive"}'::jsonb, 0.94, true),

    -- CLASSICAL
    ('INTERNET_ARCHIVE', 'Eine Kleine Nachtmusik - I. Allegro', 'Wolfgang Amadeus Mozart', 'Public Domain Recording', 360, 120, 'CLASSICAL', ARRAY['energetic', 'strings', 'classical', 'joyful'], 'https://archive.org/download/EineKleineNachtmusikAllegro/mozartekn1.mp3', '{"type": "Public Domain", "attribution": "Internet Archive"}'::jsonb, 0.93, true),
    ('INTERNET_ARCHIVE', 'Symphony No. 40 - I. Molto allegro', 'Wolfgang Amadeus Mozart', 'Public Domain Recording', 420, 135, 'CLASSICAL', ARRAY['dramatic', 'orchestral', 'classical', 'intense'], 'https://archive.org/download/Mozart-Symphony40-1/Mozart-Symphony40-1.mp3', '{"type": "Public Domain", "attribution": "Internet Archive"}'::jsonb, 0.91, true),

    -- BAROQUE
    ('INTERNET_ARCHIVE', 'Brandenburg Concerto No. 3 - I. Allegro', 'Johann Sebastian Bach', 'Public Domain Recording', 360, 110, 'BAROQUE', ARRAY['baroque', 'strings', 'structured', 'balanced'], 'https://archive.org/download/J.S.BachBrandenburgConcertoNo.3InGMajorBwv1048/Bach-BrandenburgConcerto3-1.mp3', '{"type": "Public Domain", "attribution": "Internet Archive"}'::jsonb, 0.92, true),
    ('INTERNET_ARCHIVE', 'Air on the G String', 'Johann Sebastian Bach', 'Public Domain Recording', 300, 50, 'BAROQUE', ARRAY['serene', 'strings', 'peaceful', 'flowing'], 'https://archive.org/download/BachAirOnTheGString/bach-air.mp3', '{"type": "Public Domain", "attribution": "Internet Archive"}'::jsonb, 0.96, true),
    ('INTERNET_ARCHIVE', 'Minuet in G Major', 'Johann Sebastian Bach', 'Public Domain Recording', 150, 100, 'BAROQUE', ARRAY['elegant', 'piano', 'baroque', 'dance'], 'https://archive.org/download/BachMinuetInG/bach-minuet-g.mp3', '{"type": "Public Domain", "attribution": "Internet Archive"}'::jsonb, 0.89, true),

    -- MODERN
    ('INTERNET_ARCHIVE', 'Gymnopédie No. 1', 'Erik Satie', 'Public Domain Recording', 210, 60, 'MODERN', ARRAY['minimalist', 'piano', 'simple', 'meditative'], 'https://archive.org/download/Gymnopedie1/gymnopedie1.mp3', '{"type": "Public Domain", "attribution": "Internet Archive"}'::jsonb, 0.94, true),
    ('INTERNET_ARCHIVE', 'Appalachian Spring - Simple Gifts', 'Aaron Copland', 'Public Domain Recording', 180, 90, 'MODERN', ARRAY['americana', 'pastoral', 'uplifting', 'hopeful'], 'https://archive.org/download/AppalachianSpring/copland-spring.mp3', '{"type": "Public Domain", "attribution": "Internet Archive"}'::jsonb, 0.90, true),

    -- CONTEMPORARY
    ('INTERNET_ARCHIVE', 'Ambient Meditation Track', 'Various', 'Public Domain Recording', 600, 70, 'CONTEMPORARY', ARRAY['ambient', 'meditation', 'contemporary', 'atmospheric'], 'https://archive.org/download/AmbientMeditation/ambient-meditation.mp3', '{"type": "Public Domain", "attribution": "Internet Archive"}'::jsonb, 0.85, true),

    -- CELTIC_TRADITIONAL
    ('INTERNET_ARCHIVE', 'Anderson''s Reel', 'Traditional', 'Public Domain Recording', 180, 115, 'CELTIC_TRADITIONAL', ARRAY['celtic', 'fiddle', 'traditional', 'lively'], 'https://archive.org/download/CelticReels/andersons-reel.mp3', '{"type": "Public Domain", "attribution": "Internet Archive"}'::jsonb, 0.88, true),
    ('INTERNET_ARCHIVE', 'The Humours of Lissadell', 'Traditional', 'Public Domain Recording', 150, 105, 'CELTIC_TRADITIONAL', ARRAY['celtic', 'jig', 'traditional', 'rhythmic'], 'https://archive.org/download/CelticJigs/lissadell.mp3', '{"type": "Public Domain", "attribution": "Internet Archive"}'::jsonb, 0.87, true)
) AS v(source, title, composer, artist_performer, duration_seconds, bpm, stylistic_period, mood_tags, audio_url, license_info, quality_score, is_active)
WHERE NOT EXISTS (
    SELECT 1 FROM music_tracks WHERE title = v.title
);

-- Step 4: Create 8 basic playlists (one for each stylistic period + extras)
INSERT INTO music_playlists (name, description, intended_intensity, intended_use, stylistic_period, duration_minutes_target, is_active, is_featured)
SELECT
    v.name,
    v.description,
    v.intended_intensity::music_intensity,
    v.intended_use::music_use_case,
    v.stylistic_period::stylistic_period,
    v.duration_minutes_target,
    v.is_active,
    v.is_featured
FROM (VALUES
    ('Impressionist Flow - 30 min', 'Debussy and Ravel for dreamy, fluid Pilates movement', 'LOW', 'PILATES_SLOW_FLOW', 'IMPRESSIONIST', 30, true, true),
    ('Romantic Flow - 45 min', 'Chopin and Tchaikovsky for expressive, flowing Pilates', 'MEDIUM', 'PILATES_CORE', 'ROMANTIC', 45, true, true),
    ('Classical Flow - 45 min', 'Mozart and Haydn for elegant, precise Pilates movement', 'MEDIUM', 'PILATES_CORE', 'CLASSICAL', 45, true, true),
    ('Baroque Flow - 45 min', 'Bach, Handel, and Vivaldi for structured, balanced Pilates', 'MEDIUM', 'PILATES_CORE', 'BAROQUE', 45, true, true),
    ('Modern Flow - 30 min', 'Satie and Copland for minimalist, mindful Pilates', 'LOW', 'MEDITATION', 'MODERN', 30, true, true),
    ('Contemporary Calm - 60 min', 'Ambient and minimalist music for restorative Pilates', 'LOW', 'MEDITATION', 'CONTEMPORARY', 60, true, true),
    ('Celtic Flow - 30 min', 'Traditional Celtic music for grounded, rhythmic Pilates', 'MEDIUM', 'PILATES_CORE', 'CELTIC_TRADITIONAL', 30, true, true),
    ('Baroque Gentle - 30 min', 'Gentle Baroque pieces for warm-up and cool-down', 'LOW', 'PILATES_SLOW_FLOW', 'BAROQUE', 30, true, false)
) AS v(name, description, intended_intensity, intended_use, stylistic_period, duration_minutes_target, is_active, is_featured)
WHERE NOT EXISTS (
    SELECT 1 FROM music_playlists WHERE name = v.name
);

-- Step 5: Link tracks to playlists
-- Impressionist playlist
WITH playlist AS (SELECT id FROM music_playlists WHERE name = 'Impressionist Flow - 30 min')
INSERT INTO music_playlist_tracks (playlist_id, track_id, sequence_order)
SELECT
    (SELECT id FROM playlist),
    t.id,
    ROW_NUMBER() OVER (ORDER BY t.bpm) - 1
FROM music_tracks t
WHERE t.stylistic_period = 'IMPRESSIONIST' AND t.is_active = true
ON CONFLICT DO NOTHING;

-- Romantic playlist
WITH playlist AS (SELECT id FROM music_playlists WHERE name = 'Romantic Flow - 45 min')
INSERT INTO music_playlist_tracks (playlist_id, track_id, sequence_order)
SELECT
    (SELECT id FROM playlist),
    t.id,
    ROW_NUMBER() OVER (ORDER BY t.bpm) - 1
FROM music_tracks t
WHERE t.stylistic_period = 'ROMANTIC' AND t.is_active = true
ON CONFLICT DO NOTHING;

-- Classical playlist
WITH playlist AS (SELECT id FROM music_playlists WHERE name = 'Classical Flow - 45 min')
INSERT INTO music_playlist_tracks (playlist_id, track_id, sequence_order)
SELECT
    (SELECT id FROM playlist),
    t.id,
    ROW_NUMBER() OVER (ORDER BY t.bpm) - 1
FROM music_tracks t
WHERE t.stylistic_period = 'CLASSICAL' AND t.is_active = true
ON CONFLICT DO NOTHING;

-- Baroque playlist
WITH playlist AS (SELECT id FROM music_playlists WHERE name = 'Baroque Flow - 45 min')
INSERT INTO music_playlist_tracks (playlist_id, track_id, sequence_order)
SELECT
    (SELECT id FROM playlist),
    t.id,
    ROW_NUMBER() OVER (ORDER BY t.bpm) - 1
FROM music_tracks t
WHERE t.stylistic_period = 'BAROQUE' AND t.is_active = true
ON CONFLICT DO NOTHING;

-- Modern playlist
WITH playlist AS (SELECT id FROM music_playlists WHERE name = 'Modern Flow - 30 min')
INSERT INTO music_playlist_tracks (playlist_id, track_id, sequence_order)
SELECT
    (SELECT id FROM playlist),
    t.id,
    ROW_NUMBER() OVER (ORDER BY t.bpm) - 1
FROM music_tracks t
WHERE t.stylistic_period = 'MODERN' AND t.is_active = true
ON CONFLICT DO NOTHING;

-- Contemporary playlist
WITH playlist AS (SELECT id FROM music_playlists WHERE name = 'Contemporary Calm - 60 min')
INSERT INTO music_playlist_tracks (playlist_id, track_id, sequence_order)
SELECT
    (SELECT id FROM playlist),
    t.id,
    ROW_NUMBER() OVER (ORDER BY t.bpm) - 1
FROM music_tracks t
WHERE t.stylistic_period = 'CONTEMPORARY' AND t.is_active = true
ON CONFLICT DO NOTHING;

-- Celtic playlist
WITH playlist AS (SELECT id FROM music_playlists WHERE name = 'Celtic Flow - 30 min')
INSERT INTO music_playlist_tracks (playlist_id, track_id, sequence_order)
SELECT
    (SELECT id FROM playlist),
    t.id,
    ROW_NUMBER() OVER (ORDER BY t.bpm) - 1
FROM music_tracks t
WHERE t.stylistic_period = 'CELTIC_TRADITIONAL' AND t.is_active = true
ON CONFLICT DO NOTHING;

-- Baroque Gentle playlist
WITH playlist AS (SELECT id FROM music_playlists WHERE name = 'Baroque Gentle - 30 min')
INSERT INTO music_playlist_tracks (playlist_id, track_id, sequence_order)
SELECT
    (SELECT id FROM playlist),
    t.id,
    ROW_NUMBER() OVER (ORDER BY t.bpm) - 1
FROM music_tracks t
WHERE t.stylistic_period = 'BAROQUE' AND t.bpm < 60 AND t.is_active = true
ON CONFLICT DO NOTHING;

-- Step 6: Verification
SELECT '✅ MUSIC LIBRARY RESTORED!' as status;

SELECT
    'Tracks by period:' as info,
    stylistic_period,
    COUNT(*) as track_count
FROM music_tracks
WHERE is_active = true
GROUP BY stylistic_period
ORDER BY stylistic_period;

SELECT
    'Playlists by period:' as info,
    stylistic_period,
    name,
    is_featured
FROM music_playlists
WHERE is_active = true
ORDER BY stylistic_period, is_featured DESC;

SELECT
    'Playlist track counts:' as info,
    p.name,
    COUNT(mpt.track_id) as track_count
FROM music_playlists p
LEFT JOIN music_playlist_tracks mpt ON p.id = mpt.playlist_id
WHERE p.is_active = true
GROUP BY p.id, p.name
ORDER BY p.name;
