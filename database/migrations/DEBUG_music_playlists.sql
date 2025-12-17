-- Diagnostic queries to check music playlist state after rebuild

-- 1. Check all active playlists and their track counts
SELECT
    p.id,
    p.name,
    p.stylistic_period,
    p.is_featured,
    COUNT(pt.track_id) as track_count
FROM music_playlists p
LEFT JOIN music_playlist_tracks pt ON p.id = pt.playlist_id
WHERE p.is_active = true
GROUP BY p.id, p.name, p.stylistic_period, p.is_featured
ORDER BY p.stylistic_period, p.name;

-- 2. Check specifically for Romantic playlists
SELECT
    p.id,
    p.name,
    p.stylistic_period,
    COUNT(pt.track_id) as track_count
FROM music_playlists p
LEFT JOIN music_playlist_tracks pt ON p.id = pt.playlist_id
WHERE p.stylistic_period = 'ROMANTIC'
  AND p.is_active = true
GROUP BY p.id, p.name, p.stylistic_period;

-- 3. Check if there are any NULL playlist_ids in music_playlist_tracks
SELECT COUNT(*) as null_playlist_count
FROM music_playlist_tracks
WHERE playlist_id IS NULL;

-- 4. Check number of ROMANTIC tracks available
SELECT COUNT(*) as romantic_track_count
FROM music_tracks
WHERE stylistic_period = 'ROMANTIC'
  AND is_active = true;

-- 5. Test the get_playlist_with_tracks function for first Romantic playlist
SELECT *
FROM get_playlist_with_tracks(
    (SELECT id FROM music_playlists WHERE stylistic_period = 'ROMANTIC' AND is_active = true LIMIT 1)
);
