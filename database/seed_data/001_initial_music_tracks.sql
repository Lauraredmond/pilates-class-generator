-- =============================================================================
-- Initial Music Tracks & Playlists
-- Session 9: Music Integration
--
-- Run this in Supabase SQL Editor to populate initial music data
-- =============================================================================

-- Insert Tracks
INSERT INTO music_tracks (
    source, title, composer, artist_performer, duration_seconds, bpm,
    stylistic_period, mood_tags, audio_url, license_info, quality_score, is_active
) VALUES

-- =============================================================================
-- ROMANTIC PERIOD (c. 1820-1910)
-- =============================================================================
(
    'MUSOPEN',
    'Serenade in C Major, D. 957 No. 4 ''Ständchen''',
    'Franz Schubert',
    'Musopen String Quartet',
    210,
    60,
    'ROMANTIC',
    ARRAY['calm', 'melodic', 'strings', 'gentle'],
    'https://archive.org/download/MusopenCollectionAsFlac/Schubert_Serenade_Standchen.mp3',
    '{"type": "Public Domain", "attribution": "Musopen via Internet Archive", "url": "https://archive.org/details/MusopenCollectionAsFlac"}'::jsonb,
    0.95,
    true
),
(
    'MUSOPEN',
    'Nocturne in E-flat Major, Op. 9 No. 2',
    'Frédéric Chopin',
    'Musopen Piano Collective',
    270,
    55,
    'ROMANTIC',
    ARRAY['peaceful', 'piano', 'nocturne', 'flowing'],
    'https://archive.org/download/MusopenCollectionAsFlac/Chopin_Nocturne_Op9_No2.mp3',
    '{"type": "Public Domain", "attribution": "Musopen via Internet Archive", "url": "https://archive.org/details/MusopenCollectionAsFlac"}'::jsonb,
    0.98,
    true
),
(
    'MUSOPEN',
    'Consolation No. 3 in D-flat Major, S. 172',
    'Franz Liszt',
    'Musopen Piano Collective',
    240,
    58,
    'ROMANTIC',
    ARRAY['soothing', 'piano', 'lyrical', 'gentle'],
    'https://archive.org/download/MusopenCollectionAsFlac/Liszt_Consolation_No3.mp3',
    '{"type": "Public Domain", "attribution": "Musopen via Internet Archive", "url": "https://archive.org/details/MusopenCollectionAsFlac"}'::jsonb,
    0.92,
    true
),

-- =============================================================================
-- IMPRESSIONIST PERIOD (c. 1890-1920)
-- =============================================================================
(
    'MUSOPEN',
    'Clair de Lune from Suite bergamasque',
    'Claude Debussy',
    'Musopen Piano Collective',
    300,
    52,
    'IMPRESSIONIST',
    ARRAY['atmospheric', 'piano', 'moonlight', 'delicate'],
    'https://archive.org/download/MusopenCollectionAsFlac/Debussy_Clair_de_Lune.mp3',
    '{"type": "Public Domain", "attribution": "Musopen via Internet Archive", "url": "https://archive.org/details/MusopenCollectionAsFlac"}'::jsonb,
    0.99,
    true
),
(
    'MUSOPEN',
    'Gymnopédie No. 1',
    'Erik Satie',
    'Musopen Piano Collective',
    195,
    50,
    'IMPRESSIONIST',
    ARRAY['meditative', 'piano', 'slow', 'minimal'],
    'https://archive.org/download/MusopenCollectionAsFlac/Satie_Gymnopedie_No1.mp3',
    '{"type": "Public Domain", "attribution": "Musopen via Internet Archive", "url": "https://archive.org/details/MusopenCollectionAsFlac"}'::jsonb,
    0.97,
    true
),
(
    'MUSOPEN',
    'Pavane pour une infante défunte',
    'Maurice Ravel',
    'Musopen Orchestra',
    360,
    54,
    'IMPRESSIONIST',
    ARRAY['elegant', 'orchestral', 'flowing', 'nostalgic'],
    'https://archive.org/download/MusopenCollectionAsFlac/Ravel_Pavane.mp3',
    '{"type": "Public Domain", "attribution": "Musopen via Internet Archive", "url": "https://archive.org/details/MusopenCollectionAsFlac"}'::jsonb,
    0.94,
    true
),

-- =============================================================================
-- BAROQUE PERIOD (c. 1600-1750)
-- =============================================================================
(
    'MUSOPEN',
    'Air on the G String from Orchestral Suite No. 3, BWV 1068',
    'Johann Sebastian Bach',
    'Musopen String Orchestra',
    285,
    48,
    'BAROQUE',
    ARRAY['serene', 'strings', 'flowing', 'timeless'],
    'https://archive.org/download/MusopenCollectionAsFlac/Bach_Air_on_G_String.mp3',
    '{"type": "Public Domain", "attribution": "Musopen via Internet Archive", "url": "https://archive.org/details/MusopenCollectionAsFlac"}'::jsonb,
    0.96,
    true
),
(
    'MUSOPEN',
    'Canon in D Major',
    'Johann Pachelbel',
    'Musopen Chamber Orchestra',
    300,
    56,
    'BAROQUE',
    ARRAY['calming', 'strings', 'repetitive', 'harmonious'],
    'https://archive.org/download/MusopenCollectionAsFlac/Pachelbel_Canon_in_D.mp3',
    '{"type": "Public Domain", "attribution": "Musopen via Internet Archive", "url": "https://archive.org/details/MusopenCollectionAsFlac"}'::jsonb,
    0.93,
    true
),

-- =============================================================================
-- CLASSICAL PERIOD (c. 1750-1820)
-- =============================================================================
(
    'MUSOPEN',
    'Piano Sonata No. 11 in A Major, K. 331: III. Rondo Alla Turca',
    'Wolfgang Amadeus Mozart',
    'Musopen Piano Collective',
    210,
    72,
    'CLASSICAL',
    ARRAY['lively', 'piano', 'playful', 'energetic'],
    'https://archive.org/download/MusopenCollectionAsFlac/Mozart_Turkish_March.mp3',
    '{"type": "Public Domain", "attribution": "Musopen via Internet Archive", "url": "https://archive.org/details/MusopenCollectionAsFlac"}'::jsonb,
    0.91,
    true
),
(
    'MUSOPEN',
    'Symphony No. 94 in G Major ''Surprise'': II. Andante',
    'Joseph Haydn',
    'Musopen Symphony Orchestra',
    360,
    60,
    'CLASSICAL',
    ARRAY['gentle', 'orchestral', 'elegant', 'balanced'],
    'https://archive.org/download/MusopenCollectionAsFlac/Haydn_Surprise_Symphony_Andante.mp3',
    '{"type": "Public Domain", "attribution": "Musopen via Internet Archive", "url": "https://archive.org/details/MusopenCollectionAsFlac"}'::jsonb,
    0.90,
    true
),

-- =============================================================================
-- CELTIC TRADITIONAL
-- =============================================================================
(
    'FREEPD',
    'The Minstrel Boy (Traditional Instrumental)',
    'Traditional Irish',
    'FreePD Celtic Ensemble',
    180,
    65,
    'CELTIC_TRADITIONAL',
    ARRAY['traditional', 'harp', 'celtic', 'peaceful'],
    'https://freepd.com/music/The%20Minstrel%20Boy.mp3',
    '{"type": "CC0", "attribution": "FreePD - Public Domain", "url": "https://freepd.com"}'::jsonb,
    0.85,
    true
),
(
    'FREEPD',
    'Toss the Feathers (Traditional Instrumental)',
    'Traditional Irish',
    'FreePD Celtic Ensemble',
    165,
    75,
    'CELTIC_TRADITIONAL',
    ARRAY['traditional', 'fiddle', 'celtic', 'uplifting'],
    'https://freepd.com/music/Toss%20the%20Feathers.mp3',
    '{"type": "CC0", "attribution": "FreePD - Public Domain", "url": "https://freepd.com"}'::jsonb,
    0.87,
    true
);

-- =============================================================================
-- Create Sample Playlists
-- =============================================================================

-- Romantic Slow Flow
WITH inserted_playlist AS (
    INSERT INTO music_playlists (
        name, description, intended_intensity, intended_use,
        stylistic_period, duration_minutes_target, is_active, is_featured
    ) VALUES (
        'Romantic Slow Flow - 30 min',
        'Gentle Romantic period classics for slow, flowing Pilates sessions. Features Schubert, Chopin, and Liszt.',
        'LOW',
        'PILATES_SLOW_FLOW',
        'ROMANTIC',
        30,
        true,
        true
    ) RETURNING id
)
INSERT INTO music_playlist_tracks (playlist_id, track_id, sequence_order)
SELECT
    (SELECT id FROM inserted_playlist),
    t.id,
    ROW_NUMBER() OVER () - 1
FROM music_tracks t
WHERE t.composer IN ('Franz Schubert', 'Frédéric Chopin', 'Franz Liszt')
ORDER BY t.composer;

-- Impressionist Meditation
WITH inserted_playlist AS (
    INSERT INTO music_playlists (
        name, description, intended_intensity, intended_use,
        stylistic_period, duration_minutes_target, is_active, is_featured
    ) VALUES (
        'Impressionist Meditation - 30 min',
        'Atmospheric Impressionist pieces perfect for mindful movement. Debussy, Satie, and Ravel.',
        'LOW',
        'PILATES_STRETCH',
        'IMPRESSIONIST',
        30,
        true,
        true
    ) RETURNING id
)
INSERT INTO music_playlist_tracks (playlist_id, track_id, sequence_order)
SELECT
    (SELECT id FROM inserted_playlist),
    t.id,
    ROW_NUMBER() OVER () - 1
FROM music_tracks t
WHERE t.stylistic_period = 'IMPRESSIONIST'
ORDER BY t.composer;

-- Baroque Flow
WITH inserted_playlist AS (
    INSERT INTO music_playlists (
        name, description, intended_intensity, intended_use,
        stylistic_period, duration_minutes_target, is_active, is_featured
    ) VALUES (
        'Baroque Flow - 30 min',
        'Serene Baroque masterpieces for balanced Pilates practice. Bach and Pachelbel.',
        'MEDIUM',
        'PILATES_CORE',
        'BAROQUE',
        30,
        true,
        true
    ) RETURNING id
)
INSERT INTO music_playlist_tracks (playlist_id, track_id, sequence_order)
SELECT
    (SELECT id FROM inserted_playlist),
    t.id,
    ROW_NUMBER() OVER () - 1
FROM music_tracks t
WHERE t.stylistic_period = 'BAROQUE'
ORDER BY t.composer;

-- Classical Elegance
WITH inserted_playlist AS (
    INSERT INTO music_playlists (
        name, description, intended_intensity, intended_use,
        stylistic_period, duration_minutes_target, is_active, is_featured
    ) VALUES (
        'Classical Elegance - 30 min',
        'Refined Classical period pieces for structured Pilates sessions. Mozart and Haydn.',
        'MEDIUM',
        'PILATES_CORE',
        'CLASSICAL',
        30,
        true,
        true
    ) RETURNING id
)
INSERT INTO music_playlist_tracks (playlist_id, track_id, sequence_order)
SELECT
    (SELECT id FROM inserted_playlist),
    t.id,
    ROW_NUMBER() OVER () - 1
FROM music_tracks t
WHERE t.stylistic_period = 'CLASSICAL'
ORDER BY t.composer;

-- Celtic Calm
WITH inserted_playlist AS (
    INSERT INTO music_playlists (
        name, description, intended_intensity, intended_use,
        stylistic_period, duration_minutes_target, is_active, is_featured
    ) VALUES (
        'Celtic Calm - 15 min',
        'Traditional Celtic tunes for gentle cool-down and stretching.',
        'LOW',
        'COOL_DOWN',
        'CELTIC_TRADITIONAL',
        15,
        true,
        true
    ) RETURNING id
)
INSERT INTO music_playlist_tracks (playlist_id, track_id, sequence_order)
SELECT
    (SELECT id FROM inserted_playlist),
    t.id,
    ROW_NUMBER() OVER () - 1
FROM music_tracks t
WHERE t.stylistic_period = 'CELTIC_TRADITIONAL'
ORDER BY t.title;

-- =============================================================================
-- Verify Insertion
-- =============================================================================

-- Show track count by period
SELECT
    stylistic_period,
    COUNT(*) as track_count
FROM music_tracks
WHERE is_active = true
GROUP BY stylistic_period
ORDER BY stylistic_period;

-- Show playlists
SELECT
    name,
    stylistic_period,
    intended_use,
    duration_minutes_target,
    (SELECT COUNT(*) FROM music_playlist_tracks WHERE playlist_id = music_playlists.id) as track_count
FROM music_playlists
WHERE is_active = true
ORDER BY stylistic_period, name;

-- =============================================================================
-- Done!
-- =============================================================================
SELECT 'Music data ingestion complete! 🎵' as status;
