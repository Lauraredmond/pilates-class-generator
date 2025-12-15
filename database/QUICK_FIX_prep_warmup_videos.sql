-- ============================================
-- QUICK FIX: Add video_url to Preparation & Warmup
-- ============================================
-- Run this entire script in Supabase SQL Editor
-- It will:
-- 1. Add video_url columns (if they don't exist)
-- 2. Set CloudFront URLs
-- 3. Verify the changes

-- Step 1: Add video_url columns (safe to run multiple times)
ALTER TABLE preparation_scripts ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE warmup_routines ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_preparation_has_video ON preparation_scripts(video_url) WHERE video_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_warmup_has_video ON warmup_routines(video_url) WHERE video_url IS NOT NULL;

-- Step 3: Set the CloudFront video URLs
UPDATE preparation_scripts
SET video_url = 'https://d1chkg8zq1g5j8.cloudfront.net/Generic_Placeholder.mp4'
WHERE video_url IS NULL;

UPDATE warmup_routines
SET video_url = 'https://d1chkg8zq1g5j8.cloudfront.net/Generic_Placeholder.mp4'
WHERE video_url IS NULL;

-- Step 4: Verification - Check if URLs are set
SELECT
    'preparation_scripts' as table_name,
    script_name,
    video_url,
    CASE
        WHEN video_url IS NOT NULL THEN '✅ Video URL set'
        ELSE '❌ Video URL is NULL'
    END as status
FROM preparation_scripts;

SELECT
    'warmup_routines' as table_name,
    routine_name,
    video_url,
    CASE
        WHEN video_url IS NOT NULL THEN '✅ Video URL set'
        ELSE '❌ Video URL is NULL'
    END as status
FROM warmup_routines;

-- Step 5: Test CloudFront URL is accessible (returns count > 0 if successful)
-- Note: This query will show if the URL is set, but won't test if it actually loads
SELECT
    COUNT(*) as records_with_video_url,
    CASE
        WHEN COUNT(*) > 0 THEN '✅ URLs are set in database'
        ELSE '❌ No URLs found - something went wrong'
    END as final_status
FROM (
    SELECT video_url FROM preparation_scripts WHERE video_url IS NOT NULL
    UNION ALL
    SELECT video_url FROM warmup_routines WHERE video_url IS NOT NULL
) combined;
