-- Restore Music Playlists (8 playlists for all stylistic periods)
-- Created: 2025-12-12
-- Purpose: Re-add missing playlists that were working in Session 9

-- Delete the old placeholder playlist
DELETE FROM music_playlists WHERE name = '[DEV_FIXTURE] Sample Playlist';

-- Insert 8 playlists (one for each stylistic period + featured playlists)
INSERT INTO music_playlists (name, description, intended_intensity, intended_use, stylistic_period, is_featured, is_active) VALUES
    -- Baroque Period
    ('Baroque Pilates Flow', 'Bach, Handel, and Vivaldi for structured, flowing movement', 'MEDIUM', 'PILATES_CORE', 'BAROQUE', true, true),

    -- Classical Period
    ('Classical Pilates Flow', 'Mozart and Haydn for elegant, precise movements', 'MEDIUM', 'PILATES_CORE', 'CLASSICAL', true, true),

    -- Romantic Period
    ('Romantic Pilates Flow', 'Chopin and Tchaikovsky for expressive, flowing movement', 'MEDIUM', 'PILATES_CORE', 'ROMANTIC', true, true),

    -- Impressionist Period
    ('Impressionist Pilates Flow', 'Debussy and Ravel for dreamy, fluid movement', 'LOW', 'PILATES_SLOW_FLOW', 'IMPRESSIONIST', true, true),

    -- Modern Period
    ('Modern Pilates Flow', 'Stravinsky and Copland for dynamic, rhythmic movement', 'HIGH', 'PILATES_CORE', 'MODERN', true, true),

    -- Contemporary Period
    ('Contemporary Pilates Flow', 'Minimalist and ambient music for mindful movement', 'LOW', 'PILATES_SLOW_FLOW', 'CONTEMPORARY', true, true),

    -- Celtic Traditional
    ('Celtic Pilates Flow', 'Traditional Celtic music for grounded, flowing movement', 'MEDIUM', 'PILATES_CORE', 'CELTIC_TRADITIONAL', true, true),

    -- Additional Baroque playlist (different intensity)
    ('Baroque Gentle Flow', 'Gentle Baroque pieces for warm-up and cool-down', 'LOW', 'PILATES_SLOW_FLOW', 'BAROQUE', false, true);

-- Verify playlists were created
SELECT
    name,
    stylistic_period,
    intended_intensity,
    is_featured,
    is_active
FROM music_playlists
ORDER BY stylistic_period, is_featured DESC;
