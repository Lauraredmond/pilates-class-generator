-- Migration: Update all music tracks to use AWS S3 URLs instead of archive.org
-- Run this after uploading all MP3 files to S3 bucket: pilates-music-tracks
-- Date: December 24, 2025

-- IMPORTANT: This migration maps the exact filenames we downloaded to S3 URLs
-- The filenames were sanitized during download (spaces → underscores, special chars removed)

BEGIN;

-- Baroque Period
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Hallelujah_Messiah_.mp3' WHERE title = '"Hallelujah" (Messiah)';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Air_on_the_G_String.mp3' WHERE title = 'Air on the G String';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Arrival_of_the_Queen_of_Sheba.mp3' WHERE title = 'Arrival of the Queen of Sheba';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Brandenburg_Concerto_No._3_I._Allegro.mp3' WHERE title = 'Brandenburg Concerto No. 3 - I. Allegro';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Concerto_grosso_in_A_minor_Op._6_No._4.mp3' WHERE title = 'Concerto grosso in A minor, Op. 6 No. 4';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Jesu_Joy_of_Man_s_Desiring_BWV_147.mp3' WHERE title = 'Jesu, Joy of Man''s Desiring, BWV 147';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Largo_Xerxes_.mp3' WHERE title = 'Largo (Xerxes)';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Minuet_and_Badinerie_Orchestral_Suite_No._2_.mp3' WHERE title = 'Minuet and Badinerie (Orchestral Suite No. 2)';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Minuet_in_G_Major_BWV_Anh._114.mp3' WHERE title = 'Minuet in G Major, BWV Anh. 114';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Oboe_Concerto_in_D_minor_2nd_movement.mp3' WHERE title = 'Oboe Concerto in D minor, 2nd movement';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Sinfonia_in_G_Christmas_Oratorio_.mp3' WHERE title = 'Sinfonia in G (Christmas Oratorio)';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/The_Four_Seasons_Spring_La_Primavera_I._Allegro.mp3' WHERE title = 'The Four Seasons - Spring (La Primavera): I. Allegro';

-- Classical Period (note: Dance of the Blessed Spirits download failed, keeping archive.org URL)
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Eine_kleine_Nachtmusik_K._525_I._Allegro.mp3' WHERE title = 'Eine kleine Nachtmusik, K. 525: I. Allegro';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Emperor_s_Hymn_String_Quartet_in_C_.mp3' WHERE title = 'Emperor''s Hymn (String Quartet in C)';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/F_r_Elise.mp3' WHERE title = 'Für Elise';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Minuet_in_G.mp3' WHERE title = 'Minuet in G';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Moonlight_Sonata_1st_movement.mp3' WHERE title = 'Moonlight Sonata, 1st movement';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Quintet_in_E_major_G.275_Minuet.mp3' WHERE title = 'Quintet in E major, G.275 - Minuet';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Rondo_Alla_Turca.mp3' WHERE title = 'Rondo Alla Turca';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Symphony_No._40_in_G_Minor_K._550_I._Molto_Allegro.mp3' WHERE title = 'Symphony No. 40 in G Minor, K. 550: I. Molto Allegro';

-- Romantic Period
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Ave_Maria.mp3' WHERE title = 'Ave Maria';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Ballet_Music_in_G_Rosamunde_.mp3' WHERE title = 'Ballet Music in G (Rosamunde)';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Barber_of_Seville_Overture.mp3' WHERE title = 'Barber of Seville Overture';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Cradle_Song.mp3' WHERE title = 'Cradle Song';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/German_Dance_No._1.mp3' WHERE title = 'German Dance No. 1';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/I_Love_You.mp3' WHERE title = 'I Love You';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Melody_in_F.mp3' WHERE title = 'Melody in F';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Minute_Waltz_in_D_flat_Major_Op._64_No._1.mp3' WHERE title = 'Minute Waltz in D-flat Major, Op. 64 No. 1';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Nocturne_in_E_flat_Major_Op._9_No._2.mp3' WHERE title = 'Nocturne in E-flat Major, Op. 9 No. 2';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Piano_Sonata_No._14_Moonlight_Sonata_I._Adagio_sostenuto.mp3' WHERE title = 'Piano Sonata No. 14 "Moonlight Sonata" - I. Adagio sostenuto';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Symphony_No._8_Unfinished_.mp3' WHERE title = 'Symphony No. 8 "Unfinished"';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/The_Blue_Danube.mp3' WHERE title = 'The Blue Danube';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/The_Merry_Peasant.mp3' WHERE title = 'The Merry Peasant';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Waltz.mp3' WHERE title = 'Waltz';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Waltz_of_the_Flowers.mp3' WHERE title = 'Waltz of the Flowers';

-- Impressionist Period
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Arabesque_No._1.mp3' WHERE title = 'Arabesque No. 1';

-- Modern Period
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Bol_ro.mp3' WHERE title = 'Boléro';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Appalachian_Spring_Orchestral_Suite_.mp3' WHERE title = 'Appalachian Spring (Orchestral Suite)';

-- Contemporary Period
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Womb_of_Tranquility.mp3' WHERE title = 'Womb of Tranquility';

-- Celtic Traditional (FIX THE CORRECT FILES!)
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Andersons_Slow_.mp3' WHERE title = 'Andersons (Slow)';
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/The_Humours_of_Lissadell_Slow_.mp3' WHERE title = 'The Humours of Lissadell (Slow)';

-- Jazz
UPDATE music_tracks SET audio_url = 'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/1_Hour_Relaxing_Jazz_Coffee_Shop_Music_The_Best_Melodies_That_Will_Warm_Your_Heart.mp3' WHERE title = '1 Hour Relaxing Jazz Coffee Shop Music - The Best Melodies That Will Warm Your Heart';

-- Add a verification comment
COMMENT ON TABLE music_tracks IS 'All tracks migrated to AWS S3 on 2025-12-24. Archive.org URLs replaced with S3 URLs for reliability.';

-- Verify the migration
DO $$
DECLARE
    archive_count INTEGER;
    s3_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO archive_count FROM music_tracks WHERE audio_url LIKE '%archive.org%';
    SELECT COUNT(*) INTO s3_count FROM music_tracks WHERE audio_url LIKE '%s3%' OR audio_url LIKE '%amazonaws%';

    RAISE NOTICE 'Migration Results:';
    RAISE NOTICE '  Archive.org URLs remaining: %', archive_count;
    RAISE NOTICE '  S3 URLs: %', s3_count;

    IF archive_count > 1 THEN
        RAISE NOTICE '  ⚠️ WARNING: % tracks still use archive.org (likely Dance of the Blessed Spirits)', archive_count;
    END IF;
END $$;

COMMIT;

-- To rollback if needed, you can restore from the backup:
-- BEGIN;
-- UPDATE music_tracks mt
-- SET audio_url = b.audio_url
-- FROM music_tracks_backup b
-- WHERE mt.id = b.id;
-- COMMIT;