-- Migration 016a: Add Jazz to Stylistic Period Enum
-- Created: 2025-12-04
-- Purpose: Add JAZZ enum value (MUST be run first and committed before 016b)

-- =============================================================================
-- ADD JAZZ TO STYLISTIC_PERIOD ENUM
-- =============================================================================

-- IMPORTANT: This must be run FIRST and allowed to commit before running 016b
-- PostgreSQL requires enum values to be committed before they can be used

-- This is safe to run multiple times (will fail gracefully if JAZZ already exists)
ALTER TYPE stylistic_period ADD VALUE IF NOT EXISTS 'JAZZ';

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- After running this, verify JAZZ was added:
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = 'stylistic_period'::regtype ORDER BY enumsortorder;
-- You should see JAZZ in the list

-- =============================================================================
-- NEXT STEP
-- =============================================================================

-- After this completes successfully:
-- 1. Verify JAZZ appears in the enum list (query above)
-- 2. Run migration 016b_add_jazz_data.sql to insert tracks and playlists
