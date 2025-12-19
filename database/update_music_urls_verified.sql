-- UPDATE STATEMENTS FOR MUSIC_TRACKS TABLE
-- Replace broken Archive.org URLs with verified working URLs
-- Source: Music_with_Edit_Links.xlsx (manually tested URLs)
-- Generated: 2025-12-17
--================================================================================

-- 1. Air on the G String (Bach)
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/100ClassicalMusicMasterpieces/1727_Bach_Air_mp3.mp3'
WHERE title LIKE '%Air on%G String%'
  AND composer LIKE '%Bach%';

-- 2. Adagio in G Minor (Albinoni)
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/100ClassicalMusicMasterpieces/1730_Albinoni_Adagio_mp3.mp3'
WHERE title LIKE '%Adagio%'
  AND composer LIKE '%Albinoni%';

-- 3. Brandenburg Concerto No. 3 (Bach)
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/100ClassicalMusicMasterpieces/1721_Bach_Brandenburg_Conc3_1st_mp3.mp3'
WHERE title LIKE '%Brandenburg%3%'
  AND composer LIKE '%Bach%';

-- 4. Mandolin Concerto (Vivaldi)
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/100ClassicalMusicMasterpieces/1729_Vivaldi_Mandoline_Concerto_mp3.mp3'
WHERE title LIKE '%Mandolin%Concerto%'
  AND composer LIKE '%Vivaldi%';

-- 5. Dance of the Blessed Spirits (Gluck)
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/100ClassicalMusicMasterpieces/1762_Gluck_Dance_of_the_Blessed_Spirit_mp3.mp3'
WHERE title LIKE '%Dance%Blessed Spirit%'
  AND composer LIKE '%Gluck%';

-- 6. Violin Concerto No. 3 in G (Mozart)
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/100ClassicalMusicMasterpieces/1775_Mozart_Violin_Concerto_No3_1st_mp3.mp3'
WHERE title LIKE '%Violin Concerto%3%'
  AND composer LIKE '%Mozart%';

-- 7. Serenata Notturna (Mozart)
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/100ClassicalMusicMasterpieces/1776_Serenata_Notturna_mp3.mp3'
WHERE title LIKE '%Serenata Notturna%'
  AND composer LIKE '%Mozart%';

-- 8. Piano Concerto No. 21, 2nd movement (Mozart)
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/100ClassicalMusicMasterpieces/1785_Piano_Concerto_No21_2nd_mp3.mp3'
WHERE title LIKE '%Piano Concerto%21%'
  AND composer LIKE '%Mozart%';

-- 9. Horn Concerto No. 3 in E-flat, 2nd movement (Mozart)
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/100ClassicalMusicMasterpieces/1783_Horn_Concerto_No3_2nd_mp3.mp3'
WHERE title LIKE '%Horn Concerto%3%'
  AND composer LIKE '%Mozart%';

-- 10. Flute Concerto No. 2 in D, 2nd movement (Mozart)
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/100ClassicalMusicMasterpieces/1778_Flute_Concerto_No2_2nd_mp3.mp3'
WHERE title LIKE '%Flute Concerto%2%'
  AND composer LIKE '%Mozart%';

-- 11. Symphony No. 94 'Surprise', 2nd movement (Haydn)
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/100ClassicalMusicMasterpieces/1791_Haydn_Symphony_No94_2nd_mp3.mp3'
WHERE title LIKE '%Symphony%94%'
  AND composer LIKE '%Haydn%';

-- 12. Clarinet Concerto in A Major, K. 622: II. Adagio (Mozart)
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/100ClassicalMusicMasterpieces/1791_Mozart_Clarinet_Concerto_2nd_mp3.mp3'
WHERE title LIKE '%Clarinet Concerto%'
  AND composer LIKE '%Mozart%';

-- 13. Moonlight Sonata, 1st movement (Beethoven)
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/100ClassicalMusicMasterpieces/1796_Beethoven_Moonlight_Sonata_1st_mp3.mp3'
WHERE title LIKE '%Moonlight%Sonata%'
  AND composer LIKE '%Beethoven%';

-- 14. Emperor's Hymn (Haydn)
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/100ClassicalMusicMasterpieces/1796_Haydn_Emperor_Hymn_mp3.mp3'
WHERE title LIKE '%Emperor%Hymn%'
  AND composer LIKE '%Haydn%';

-- 15. The Magic Flute - Overture (Mozart)
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/100ClassicalMusicMasterpieces/1791_Mozart_The_Magic_Flute_Overture_mp3.mp3'
WHERE title LIKE '%Magic Flute%'
  AND composer LIKE '%Mozart%';

-- 16. Clair de Lune (Debussy)
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/lp_the-impressionists_erik-satie-claude-debussy-maurice-ravel-ga/01%20-%20Claude%20Debussy%20-%20Clair%20de%20Lune.mp3'
WHERE title LIKE '%Clair%Lune%'
  AND composer LIKE '%Debussy%';

-- 17. Gymnopédie No. 1 (Satie)
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/lp_the-impressionists_erik-satie-claude-debussy-maurice-ravel-ga/03%20-%20Erik%20Satie%20-%20Gymnopedie%20No.1.mp3'
WHERE title LIKE '%Gymnop%die%1%'
  AND composer LIKE '%Satie%';

--================================================================================
-- Total: 17 UPDATE statements
--================================================================================

-- VERIFICATION QUERIES:
-- Run these after updates to verify changes:

-- 1. Check updated records
SELECT title, composer, audio_url
FROM music_tracks
WHERE audio_url LIKE '%100ClassicalMusicMasterpieces%'
   OR audio_url LIKE '%lp_the-impressionists%'
ORDER BY composer, title;

-- 2. Count updated records
SELECT COUNT(*) as updated_count
FROM music_tracks
WHERE audio_url LIKE '%100ClassicalMusicMasterpieces%'
   OR audio_url LIKE '%lp_the-impressionists%';

-- 3. Check for any remaining old broken URLs (if you know patterns)
-- Adjust the LIKE patterns based on your old URL structure
-- SELECT title, composer, audio_url
-- FROM music_tracks
-- WHERE audio_url LIKE '%OLD_PATTERN%';

--================================================================================
-- NOTES:
-- - These URLs were manually tested and verified working on 2025-12-17
-- - Source: 100ClassicalMusicMasterpieces collection on Archive.org
-- - All tracks are public domain or Creative Commons licensed
-- - LIKE pattern matching used to handle variations in title/composer names
--================================================================================
