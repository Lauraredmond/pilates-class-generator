-- Migration 040: Create user_profiles table (missing from dev database)
-- Created: 2025-12-29
-- Purpose: Fix HTTP 500 error in early skip analytics endpoint (requires user_profiles.is_admin)
--
-- Context: Production has this table, but dev database is missing it.
-- This migration brings dev database schema up to parity with production.

-- ============================================================================
-- CREATE USER_PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY,  -- References auth.users(id)
    email TEXT NOT NULL,
    full_name TEXT,
    hashed_password TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITHOUT TIME ZONE,

    -- Demographics (optional)
    age_range VARCHAR(20),
    gender_identity VARCHAR(50),
    country VARCHAR(100),
    pilates_experience VARCHAR(20),
    goals JSONB DEFAULT '[]'::jsonb,

    -- Admin flag for QA/diagnostic features
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,

    -- Legal acceptance timestamps
    accepted_privacy_at TIMESTAMP WITH TIME ZONE,
    accepted_beta_terms_at TIMESTAMP WITH TIME ZONE,
    accepted_safety_at TIMESTAMP WITH TIME ZONE,

    -- Health screening
    is_pregnant BOOLEAN DEFAULT FALSE,
    is_injury_free BOOLEAN DEFAULT FALSE,

    -- Constraints
    CONSTRAINT check_age_range CHECK (
        age_range IS NULL OR
        age_range IN ('18-24', '25-34', '35-44', '45-54', '55-64', '65+')
    ),
    CONSTRAINT check_pilates_experience CHECK (
        pilates_experience IS NULL OR
        pilates_experience IN ('Beginner', 'Intermediate', 'Advanced', 'Instructor')
    )
);

COMMENT ON TABLE user_profiles IS 'User profiles with demographics and Pilates experience for personalization';
COMMENT ON COLUMN user_profiles.age_range IS 'Age range: 18-24, 25-34, 35-44, 45-54, 55-64, 65+';
COMMENT ON COLUMN user_profiles.gender_identity IS 'Optional: Female, Male, Non-binary, Prefer not to say, Other';
COMMENT ON COLUMN user_profiles.country IS 'User country (ISO 3166-1 alpha-2 or full name)';
COMMENT ON COLUMN user_profiles.is_admin IS 'Admin flag - gates access to QA reports, analytics, and diagnostic features';

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_user_profiles_pilates_experience ON user_profiles(pilates_experience);

-- ============================================================================
-- SET YOUR ACCOUNT AS ADMIN
-- ============================================================================

-- IMPORTANT: Replace with your actual user ID from the database
-- Get your user_id by running:
-- SELECT id, email FROM auth.users;

-- Example (uncomment and replace with your ID):
-- UPDATE user_profiles SET is_admin = true WHERE id = 'c6db6029-5e98-4d4d-89b9-d6e9de65acb3';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check table was created:
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'user_profiles';

-- Check your admin status:
-- SELECT id, email, is_admin FROM user_profiles WHERE is_admin = true;

-- Count admin vs regular users:
-- SELECT is_admin, COUNT(*) FROM user_profiles GROUP BY is_admin;
