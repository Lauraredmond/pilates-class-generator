-- Migration 032: Add Video URL Support for Movement Demonstrations
-- Created: 2025-12-15
-- Purpose: Add video_url column to movements table for AWS CloudFront video hosting
-- Context: AWS $1,000 credits integration for video demonstrations (Phase 1: "The Hundred")

-- ============================================================================
-- ADD VIDEO_URL COLUMN TO MOVEMENTS TABLE
-- ============================================================================

ALTER TABLE movements
ADD COLUMN video_url TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN movements.video_url IS 'CloudFront CDN URL for movement demonstration video (optional, Phase 1: The Hundred only)';

-- Create index for quick video availability checks
CREATE INDEX idx_movements_has_video ON movements(video_url) WHERE video_url IS NOT NULL;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this after migration to verify:
-- SELECT name, video_url FROM movements WHERE video_url IS NOT NULL;
-- Expected: 0 rows initially, then 1 row after "The Hundred" video upload
