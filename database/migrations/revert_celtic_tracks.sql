-- Revert Celtic tracks to original archive.org URLs
-- Archive.org is back online, so restore original URLs

UPDATE music_tracks
SET audio_url = 'https://archive.org/download/TradschoolIrishFluteTunes/andersons_slow.mp3'
WHERE id = '54b52558-b4fb-442f-aa8e-fc621fb2bac9';

UPDATE music_tracks
SET audio_url = 'https://archive.org/download/TradschoolIrishFluteTunes/humours_of_lissadell_slow.mp3'
WHERE id = '926ac3b1-d9a8-465b-bdf5-995e7e71979e';

-- Verify
SELECT id, title, audio_url
FROM music_tracks
WHERE id IN ('54b52558-b4fb-442f-aa8e-fc621fb2bac9', '926ac3b1-d9a8-465b-bdf5-995e7e71979e');
