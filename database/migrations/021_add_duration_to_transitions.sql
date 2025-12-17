-- Migration 021: Add duration_seconds to transitions table
-- Date: 2025-12-16
-- Purpose: Allow configurable transition durations instead of hardcoded 60s

-- Add duration_seconds column to transitions table
ALTER TABLE transitions
ADD COLUMN duration_seconds INTEGER NOT NULL DEFAULT 60;

-- Add comment explaining the field
COMMENT ON COLUMN transitions.duration_seconds IS 'Duration of transition in seconds (configurable for UAT testing)';

-- Set reasonable defaults based on transition complexity
-- Simple position changes: 30s
-- Complex position changes: 60s
-- Most transitions will use 60s default

-- Update specific transitions if needed (example - adjust as needed)
-- UPDATE transitions SET duration_seconds = 30 WHERE from_position = to_position;
-- UPDATE transitions SET duration_seconds = 90 WHERE from_position = 'Prone' AND to_position = 'Supine';

-- Log the migration
DO $$
BEGIN
    RAISE NOTICE 'Migration 021: Added duration_seconds to transitions table';
    RAISE NOTICE 'Default value: 60 seconds';
    RAISE NOTICE 'Database-driven durations now available for all 7 section types';
END $$;
