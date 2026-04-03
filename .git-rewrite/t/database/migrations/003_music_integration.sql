-- Migration 003: Music Integration Tables
-- Purpose: Support Musopen/FreePD music integration with vendor-agnostic architecture
-- Session: 9 - Music Integration

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Music source providers
CREATE TYPE music_source AS ENUM ('MUSOPEN', 'FREEPD', 'JAMENDO', 'EPIDEMIC_SOUND');

-- Musical stylistic periods
CREATE TYPE stylistic_period AS ENUM (
    'BAROQUE',           -- c. 1600-1750: Bach, Handel, Vivaldi
    'CLASSICAL',         -- c. 1750-1820: Mozart, Haydn, early Beethoven
    'ROMANTIC',          -- c. 1820-1910: Chopin, Tchaikovsky, Brahms
    'IMPRESSIONIST',     -- c. 1890-1920: Debussy, Ravel
    'MODERN',            -- c. 1900-1975: Stravinsky, Bartók, Copland
    'CONTEMPORARY',      -- 1975-present: Minimalist, ambient, neo-classical
    'CELTIC_TRADITIONAL' -- Traditional Celtic music
);

-- Intensity levels for workout matching
CREATE TYPE music_intensity AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- Intended use cases
CREATE TYPE music_use_case AS ENUM (
    'PILATES_SLOW_FLOW',
    'PILATES_CORE',
    'PILATES_STRETCH',
    'WARM_UP',
    'COOL_DOWN',
    'MEDITATION',
    'GENERAL'
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- Music Tracks Table
-- Stores individual music tracks from various sources (Musopen, FreePD, etc.)
CREATE TABLE music_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Source information
    source music_source NOT NULL,
    provider_track_id VARCHAR(255),  -- External ID from provider
    provider_url TEXT,                -- Direct link to provider page

    -- Track metadata
    title VARCHAR(500) NOT NULL,
    composer VARCHAR(255),
    artist_performer VARCHAR(255),

    -- Technical details
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
    bpm INTEGER CHECK (bpm > 0 AND bpm < 300),  -- Beats per minute (nullable)

    -- Classification
    stylistic_period stylistic_period NOT NULL,
    mood_tags TEXT[],  -- Array of mood tags: ['gentle', 'piano', 'flowing']

    -- Audio streaming
    audio_url TEXT NOT NULL,  -- Direct streaming URL from provider CDN
    waveform_url TEXT,        -- Optional waveform visualization data
    peak_data JSONB,          -- Optional audio peak data for visualization

    -- Legal
    license_info JSONB NOT NULL,  -- License details (type, attribution, etc.)

    -- Quality & curation
    is_active BOOLEAN DEFAULT true,
    quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 1),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Music Playlists Table
-- Curated playlists for different workout types and musical periods
CREATE TABLE music_playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Playlist metadata
    name VARCHAR(500) NOT NULL,
    description TEXT,

    -- Workout matching
    intended_intensity music_intensity NOT NULL,
    intended_use music_use_case NOT NULL,
    duration_minutes_target INTEGER CHECK (duration_minutes_target > 0),

    -- Musical classification
    stylistic_period stylistic_period NOT NULL,

    -- Curation
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,

    -- Metadata
    created_by UUID REFERENCES auth.users(id),  -- Who curated this playlist
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Music Playlist Tracks (Many-to-Many Join Table)
-- Defines which tracks are in which playlists and their order
CREATE TABLE music_playlist_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    playlist_id UUID NOT NULL REFERENCES music_playlists(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES music_tracks(id) ON DELETE CASCADE,

    -- Sequencing
    sequence_order INTEGER NOT NULL CHECK (sequence_order >= 0),

    -- Optional time slicing (start/end at specific points in track)
    start_offset_seconds INTEGER DEFAULT 0 CHECK (start_offset_seconds >= 0),
    end_offset_seconds INTEGER,  -- NULL means play to end

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure unique track order within playlist
    UNIQUE(playlist_id, sequence_order)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Music tracks indexes
CREATE INDEX idx_music_tracks_source ON music_tracks(source);
CREATE INDEX idx_music_tracks_stylistic_period ON music_tracks(stylistic_period);
CREATE INDEX idx_music_tracks_is_active ON music_tracks(is_active);
CREATE INDEX idx_music_tracks_bpm ON music_tracks(bpm) WHERE bpm IS NOT NULL;

-- Music playlists indexes
CREATE INDEX idx_music_playlists_stylistic_period ON music_playlists(stylistic_period);
CREATE INDEX idx_music_playlists_intensity_use ON music_playlists(intended_intensity, intended_use);
CREATE INDEX idx_music_playlists_is_active ON music_playlists(is_active);
CREATE INDEX idx_music_playlists_is_featured ON music_playlists(is_featured);

-- Playlist tracks indexes
CREATE INDEX idx_playlist_tracks_playlist_id ON music_playlist_tracks(playlist_id);
CREATE INDEX idx_playlist_tracks_track_id ON music_playlist_tracks(track_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all music tables
ALTER TABLE music_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_playlist_tracks ENABLE ROW LEVEL SECURITY;

-- Music Tracks Policies
-- Public read access to active tracks (clients can browse)
CREATE POLICY "music_tracks_select_active" ON music_tracks
    FOR SELECT
    USING (is_active = true);

-- Only authenticated backend service role can modify
CREATE POLICY "music_tracks_insert_service" ON music_tracks
    FOR INSERT
    WITH CHECK (false);  -- Only service role can insert (via backend API)

CREATE POLICY "music_tracks_update_service" ON music_tracks
    FOR UPDATE
    USING (false);  -- Only service role can update (via backend API)

-- Music Playlists Policies
-- Public read access to active, non-private playlists
CREATE POLICY "music_playlists_select_active" ON music_playlists
    FOR SELECT
    USING (is_active = true);

-- Only authenticated backend service role can modify
CREATE POLICY "music_playlists_insert_service" ON music_playlists
    FOR INSERT
    WITH CHECK (false);  -- Only service role can insert (via backend API)

CREATE POLICY "music_playlists_update_service" ON music_playlists
    FOR UPDATE
    USING (false);  -- Only service role can update (via backend API)

-- Music Playlist Tracks Policies
-- Public read access (needed to see playlist contents)
CREATE POLICY "music_playlist_tracks_select_all" ON music_playlist_tracks
    FOR SELECT
    USING (true);

-- Only service role can modify
CREATE POLICY "music_playlist_tracks_insert_service" ON music_playlist_tracks
    FOR INSERT
    WITH CHECK (false);

CREATE POLICY "music_playlist_tracks_delete_service" ON music_playlist_tracks
    FOR DELETE
    USING (false);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get playlist with all tracks in order
CREATE OR REPLACE FUNCTION get_playlist_with_tracks(playlist_uuid UUID)
RETURNS TABLE (
    playlist_id UUID,
    playlist_name VARCHAR(500),
    playlist_description TEXT,
    track_id UUID,
    track_title VARCHAR(500),
    track_composer VARCHAR(255),
    track_performer VARCHAR(255),
    track_duration_seconds INTEGER,
    track_audio_url TEXT,
    track_bpm INTEGER,
    sequence_order INTEGER,
    start_offset_seconds INTEGER,
    end_offset_seconds INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        mp.id AS playlist_id,
        mp.name AS playlist_name,
        mp.description AS playlist_description,
        mt.id AS track_id,
        mt.title AS track_title,
        mt.composer AS track_composer,
        mt.artist_performer AS track_performer,
        mt.duration_seconds AS track_duration_seconds,
        mt.audio_url AS track_audio_url,
        mt.bpm AS track_bpm,
        mpt.sequence_order,
        mpt.start_offset_seconds,
        mpt.end_offset_seconds
    FROM music_playlists mp
    JOIN music_playlist_tracks mpt ON mp.id = mpt.playlist_id
    JOIN music_tracks mt ON mpt.track_id = mt.id
    WHERE mp.id = playlist_uuid
        AND mp.is_active = true
        AND mt.is_active = true
    ORDER BY mpt.sequence_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate total playlist duration
CREATE OR REPLACE FUNCTION calculate_playlist_duration(playlist_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_duration INTEGER;
BEGIN
    SELECT COALESCE(SUM(
        CASE
            WHEN mpt.end_offset_seconds IS NOT NULL
            THEN mpt.end_offset_seconds - mpt.start_offset_seconds
            ELSE mt.duration_seconds - mpt.start_offset_seconds
        END
    ), 0) INTO total_duration
    FROM music_playlist_tracks mpt
    JOIN music_tracks mt ON mpt.track_id = mt.id
    WHERE mpt.playlist_id = playlist_uuid
        AND mt.is_active = true;

    RETURN total_duration;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update updated_at timestamp on music_tracks
CREATE OR REPLACE FUNCTION update_music_tracks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER music_tracks_updated_at
    BEFORE UPDATE ON music_tracks
    FOR EACH ROW
    EXECUTE FUNCTION update_music_tracks_updated_at();

-- Update updated_at timestamp on music_playlists
CREATE OR REPLACE FUNCTION update_music_playlists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER music_playlists_updated_at
    BEFORE UPDATE ON music_playlists
    FOR EACH ROW
    EXECUTE FUNCTION update_music_playlists_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE music_tracks IS 'Individual music tracks from Musopen, FreePD, and other sources';
COMMENT ON TABLE music_playlists IS 'Curated playlists for different Pilates workout types';
COMMENT ON TABLE music_playlist_tracks IS 'Many-to-many relationship between playlists and tracks';

COMMENT ON COLUMN music_tracks.audio_url IS 'Direct streaming URL from provider CDN (never self-hosted)';
COMMENT ON COLUMN music_tracks.license_info IS 'JSONB containing license type, attribution requirements, etc.';
COMMENT ON COLUMN music_playlists.intended_use IS 'What type of workout this playlist is designed for';

-- =============================================================================
-- SEED DATA (Development Only - Will be replaced with real data)
-- =============================================================================

-- Note: In production, this seed data will be replaced with real tracks from Musopen/FreePD
-- For now, we create placeholder structure to enable development

-- This seed data is clearly marked as "DEVELOPMENT_FIXTURE" in the title
-- to distinguish it from real production data
INSERT INTO music_tracks (source, title, composer, artist_performer, duration_seconds, stylistic_period, audio_url, license_info, is_active) VALUES
    ('MUSOPEN', '[DEV_FIXTURE] Bach Prelude Sample', 'Johann Sebastian Bach', 'Development Placeholder', 180, 'BAROQUE', 'https://example.com/placeholder', '{"type": "CC0", "attribution": "Development only"}', false);

-- Placeholder playlist (inactive for development)
INSERT INTO music_playlists (name, description, intended_intensity, intended_use, stylistic_period, is_active) VALUES
    ('[DEV_FIXTURE] Sample Playlist', 'Development placeholder - will be replaced', 'LOW', 'GENERAL', 'BAROQUE', false);

COMMENT ON TABLE music_tracks IS 'Music tracks from Musopen/FreePD. Tracks with [DEV_FIXTURE] prefix are development placeholders only.';
