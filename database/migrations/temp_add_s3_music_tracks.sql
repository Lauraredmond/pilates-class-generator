-- Migration: Add AWS S3-hosted music tracks (proof-of-concept)
-- Date: 2024-12-24
-- Purpose: Test S3 hosting as alternative to archive.org (which is experiencing outages)

-- Insert 5 new music tracks hosted on AWS S3
INSERT INTO music_tracks (
    id,
    title,
    composer,
    performer,
    duration_seconds,
    bpm,
    stylistic_period,
    audio_url,
    license_info,
    source
) VALUES
-- 1. Keys Of Moon - The Inspiration (Contemporary/Ambient)
(
    gen_random_uuid(),
    'The Inspiration',
    'Keys Of Moon',
    'Keys Of Moon',
    180, -- Approximate duration (adjust after testing)
    70,  -- Slow, meditative BPM
    'Contemporary',
    'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Keys+Of+Moon+-+The+Inspiration.mp3',
    'Public Domain / Royalty Free',
    'AWS_S3'
),

-- 2. Beethoven - Moonlight Sonata, 2nd movement (Allegretto)
(
    gen_random_uuid(),
    'Piano Sonata No. 14 "Moonlight Sonata" - II. Allegretto',
    'Ludwig van Beethoven',
    'Unknown',
    150, -- Approximate duration
    90,  -- Allegretto tempo
    'Classical',
    'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Piano+Sonata+no.+14+in+C%23m+%27Moonlight%27%2C+Op.+27+no.+2+-+II.+Allegretto.mp3',
    'Public Domain',
    'AWS_S3'
),

-- 3. Schumann - Scenes from Childhood, Op. 15 - X. Almost Too Serious
(
    gen_random_uuid(),
    'Scenes from Childhood, Op. 15 - X. Almost Too Serious',
    'Robert Schumann',
    'Unknown',
    120, -- Approximate duration
    75,  -- Moderato
    'Romantic',
    'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Scenes+from+Childhood%2C+Op.+15+-+X.+Almost+Too+Serious.mp3',
    'Public Domain',
    'AWS_S3'
),

-- 4. Sonatina No. 1 in C Major - II. Andante
(
    gen_random_uuid(),
    'Sonatina No. 1 in C Major - II. Andante',
    'Unknown', -- Composer TBD (could be Clementi, Kuhlau, or others)
    'Unknown',
    140, -- Approximate duration
    80,  -- Andante tempo
    'Classical',
    'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Sonatina+No.+1+in+C+Major+-+II.+Andante.mp3',
    'Public Domain',
    'AWS_S3'
),

-- 5. Vivaldi - Violin Concerto "Spring" - II. Largo
(
    gen_random_uuid(),
    'Violin Concerto in E major, RV 269 "Spring" - II. Largo',
    'Antonio Vivaldi',
    'Unknown',
    160, -- Approximate duration
    60,  -- Largo (slow)
    'Baroque',
    'https://pilates-music-tracks.s3.us-east-1.amazonaws.com/Violin+Concerto+in+E+major%2C+RV+269+%27Spring%27+-+II.+Largo.mp3',
    'Public Domain',
    'AWS_S3'
);

-- Verification query (run after INSERT)
-- SELECT title, composer, stylistic_period, audio_url
-- FROM music_tracks
-- WHERE source = 'AWS_S3'
-- ORDER BY stylistic_period, title;
