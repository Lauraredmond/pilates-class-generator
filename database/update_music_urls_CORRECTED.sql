-- UPDATE STATEMENTS FOR MUSIC_TRACKS TABLE - CORRECTED URLS
-- Source: Archive.org 100ClassicalMusicMasterpieces collection (ACTUAL filenames verified)
-- Generated: 2025-12-18
--
-- PROBLEM IDENTIFIED: The Music_with_Edit_Links.xlsx file had INCORRECT filenames
-- SOLUTION: Using ACTUAL filenames from Archive.org collection metadata
--
--================================================================================

-- 1. Air on the G String (Bach)
-- Actual filename: 1727 Bach , Air (from Orchestral Suite No. 3 in D).mp3
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/100ClassicalMusicMasterpieces/1727%20Bach%20%2C%20Air%20%28from%20Orchestral%20Suite%20No.%203%20in%20D%29.mp3'
WHERE title LIKE '%Air on%G String%'
  AND composer LIKE '%Bach%';

-- 2. Brandenburg Concerto No. 3 (Bach)
-- Actual filename: 1721 Bach , Brandenburg Concerto No. 3, 1st movement.mp3
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/100ClassicalMusicMasterpieces/1721%20Bach%20%2C%20Brandenburg%20Concerto%20No.%203%2C%201st%20movement.mp3'
WHERE title LIKE '%Brandenburg%3%'
  AND composer LIKE '%Bach%';

-- 3. Mandolin Concerto (Vivaldi)
-- Actual filename: 1729 Vivaldi , Mandoline Concerto in C, RV 425.mp3
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/100ClassicalMusicMasterpieces/1729%20Vivaldi%20%2C%20Mandoline%20Concerto%20in%20C%2C%20RV%20425.mp3'
WHERE title LIKE '%Mandolin%Concerto%'
  AND composer LIKE '%Vivaldi%';

-- 4. Dance of the Blessed Spirits (Gluck)
-- Actual filename: 1762 Gluck , Dance of the Blessed Spirtis (from 'Orpheus and Eurydice').mp3
-- Note: Archive.org has typo "Spirtis" instead of "Spirits"
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/100ClassicalMusicMasterpieces/1762%20Gluck%20%2C%20Dance%20of%20the%20Blessed%20Spirtis%20%28from%20%27Orpheus%20and%20Eurydice%27%29.mp3'
WHERE title LIKE '%Dance%Blessed Spirit%'
  AND composer LIKE '%Gluck%';

-- 5. Violin Concerto No. 3 (Mozart)
-- Actual filename: 1775 Mozart , Violin Concerto No. 3 in G, 1st movement.mp3
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/100ClassicalMusicMasterpieces/1775%20Mozart%20%2C%20Violin%20Concerto%20No.%203%20in%20G%2C%201st%20movement.mp3'
WHERE title LIKE '%Violin Concerto%3%'
  AND composer LIKE '%Mozart%';

-- 6. Serenata Notturna (Mozart)
-- Actual filename: 1776 Serenata Notturna.mp3
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/100ClassicalMusicMasterpieces/1776%20Serenata%20Notturna.mp3'
WHERE title LIKE '%Serenata Notturna%'
  AND composer LIKE '%Mozart%';

-- 7. Flute Concerto No. 2 (Mozart)
-- Actual filename: 1778 Flute Concerto No. 2 in D, 2nd movement.mp3
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/100ClassicalMusicMasterpieces/1778%20Flute%20Concerto%20No.%202%20in%20D%2C%202nd%20movement.mp3'
WHERE title LIKE '%Flute Concerto%2%'
  AND composer LIKE '%Mozart%';

-- 8. Horn Concerto No. 3 (Mozart)
-- Actual filename: 1783 Horn Concerto No. 3 in E flat, 2nd movement.mp3
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/100ClassicalMusicMasterpieces/1783%20Horn%20Concerto%20No.%203%20in%20E%20flat%2C%202nd%20movement.mp3'
WHERE title LIKE '%Horn Concerto%3%'
  AND composer LIKE '%Mozart%';

-- 9. Piano Concerto No. 21 (Mozart)
-- Actual filename: 1785 Piano Concerto No. 21 in C, 2nd movement ('Elvira Madigan').mp3
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/100ClassicalMusicMasterpieces/1785%20Piano%20Concerto%20No.%2021%20in%20C%2C%202nd%20movement%20%28%27Elvira%20Madigan%27%29.mp3'
WHERE title LIKE '%Piano Concerto%21%'
  AND composer LIKE '%Mozart%';

-- 10. Clarinet Concerto (Mozart)
-- Actual filename: 1791 Mozart- Clarinet Concerto in A, 2nd movement.mp3
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/100ClassicalMusicMasterpieces/1791%20Mozart-%20Clarinet%20Concerto%20in%20A%2C%202nd%20movement.mp3'
WHERE title LIKE '%Clarinet Concerto%'
  AND composer LIKE '%Mozart%';

-- 11. Symphony No. 94 "Surprise" (Haydn)
-- Actual filename: 1791 Haydn- Symphony No. 94, 'Surprise', 2nd movement.mp3
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/100ClassicalMusicMasterpieces/1791%20Haydn-%20Symphony%20No.%2094%2C%20%27Surprise%27%2C%202nd%20movement.mp3'
WHERE title LIKE '%Symphony%94%'
  AND composer LIKE '%Haydn%';

-- 12. Emperor's Hymn (Haydn)
-- Actual filename: 1797 Haydn- Emporor's Hymn, from String Quartet in C.mp3
-- Note: Archive.org has typo "Emporor" instead of "Emperor"
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/100ClassicalMusicMasterpieces/1797%20Haydn-%20Emporor%27s%20Hymn%2C%20from%20String%20Quartet%20in%20C.mp3'
WHERE title LIKE '%Emperor%Hymn%'
  AND composer LIKE '%Haydn%';

-- 13. Moonlight Sonata (Beethoven)
-- Actual filename: 1801 Beethoven- 'Moonlight' Sonata, 1st movement.mp3
UPDATE music_tracks
SET audio_url = 'https://archive.org/download/100ClassicalMusicMasterpieces/1801%20Beethoven-%20%27Moonlight%27%20Sonata%2C%201st%20movement.mp3'
WHERE title LIKE '%Moonlight%Sonata%'
  AND composer LIKE '%Beethoven%';

--================================================================================
-- Total: 13 UPDATE statements
--================================================================================

-- VERIFICATION QUERIES:
-- Run these after updates to verify changes:

-- 1. Check all updated records
SELECT title, composer, audio_url
FROM music_tracks
WHERE audio_url LIKE '%100ClassicalMusicMasterpieces%'
ORDER BY composer, title;

-- 2. Count updated records
SELECT COUNT(*) as updated_count
FROM music_tracks
WHERE audio_url LIKE '%100ClassicalMusicMasterpieces%';

-- 3. Test one URL to verify it works
-- Copy this URL and paste in browser to test:
-- https://archive.org/download/100ClassicalMusicMasterpieces/1727%20Bach%20%2C%20Air%20%28from%20Orchestral%20Suite%20No.%203%20in%20D%29.mp3

--================================================================================
-- NOTES:
-- - These URLs were verified against Archive.org collection metadata (2025-12-18)
-- - All 100 MP3 files exist in the collection
-- - Filenames use ACTUAL names, not simplified versions
-- - URL encoding applied for spaces and special characters
-- - All tracks are public domain
--================================================================================
