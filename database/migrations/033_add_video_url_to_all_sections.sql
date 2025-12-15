-- Migration: Add video_url to all class section tables
-- Date: December 15, 2025
-- Purpose: Enable video demonstrations for all 6 class section types (not just movements)

-- 1. Add video_url to preparation_scripts
ALTER TABLE preparation_scripts
ADD COLUMN video_url TEXT;

COMMENT ON COLUMN preparation_scripts.video_url IS 'CloudFront CDN URL for preparation demonstration video (optional)';

CREATE INDEX idx_preparation_has_video ON preparation_scripts(video_url) WHERE video_url IS NOT NULL;

-- 2. Add video_url to warmup_routines
ALTER TABLE warmup_routines
ADD COLUMN video_url TEXT;

COMMENT ON COLUMN warmup_routines.video_url IS 'CloudFront CDN URL for warmup demonstration video (optional)';

CREATE INDEX idx_warmup_has_video ON warmup_routines(video_url) WHERE video_url IS NOT NULL;

-- 3. Add video_url to cooldown_sequences
ALTER TABLE cooldown_sequences
ADD COLUMN video_url TEXT;

COMMENT ON COLUMN cooldown_sequences.video_url IS 'CloudFront CDN URL for cooldown demonstration video (optional)';

CREATE INDEX idx_cooldown_has_video ON cooldown_sequences(video_url) WHERE video_url IS NOT NULL;

-- 4. Add video_url to closing_meditation_scripts
ALTER TABLE closing_meditation_scripts
ADD COLUMN video_url TEXT;

COMMENT ON COLUMN closing_meditation_scripts.video_url IS 'CloudFront CDN URL for meditation demonstration video (optional)';

CREATE INDEX idx_meditation_has_video ON closing_meditation_scripts(video_url) WHERE video_url IS NOT NULL;

-- 5. Add video_url to closing_homecare_advice
ALTER TABLE closing_homecare_advice
ADD COLUMN video_url TEXT;

COMMENT ON COLUMN closing_homecare_advice.video_url IS 'CloudFront CDN URL for homecare demonstration video (optional)';

CREATE INDEX idx_homecare_has_video ON closing_homecare_advice(video_url) WHERE video_url IS NOT NULL;

-- Verification queries
-- SELECT 'preparation_scripts' as table_name, COUNT(*) as total, COUNT(video_url) as with_video FROM preparation_scripts
-- UNION ALL
-- SELECT 'warmup_routines', COUNT(*), COUNT(video_url) FROM warmup_routines
-- UNION ALL
-- SELECT 'cooldown_sequences', COUNT(*), COUNT(video_url) FROM cooldown_sequences
-- UNION ALL
-- SELECT 'closing_meditation_scripts', COUNT(*), COUNT(video_url) FROM closing_meditation_scripts
-- UNION ALL
-- SELECT 'closing_homecare_advice', COUNT(*), COUNT(video_url) FROM closing_homecare_advice;
