-- ================================================================
-- Quick Variety Check for Your Recent Classes
-- Purpose: Verify current variety levels and identify issues
-- Author: Claude Code
-- Date: 2026-02-02
-- ================================================================

-- ================================================================
-- 1. YOUR PERSONAL VARIETY STATS (Last 7 Days)
-- ================================================================

WITH your_recent_classes AS (
    SELECT DISTINCT
        ch.id as class_id,
        ch.created_at,
        ch.difficulty_level,
        ch.duration_minutes
    FROM class_history ch
    WHERE ch.created_at >= CURRENT_DATE - INTERVAL '7 days'
    ORDER BY ch.created_at DESC
),
your_movements AS (
    SELECT
        cm.movement_id,
        cm.movement_name,
        COUNT(*) as times_used,
        MIN(cm.class_generated_at) as first_used,
        MAX(cm.class_generated_at) as last_used
    FROM class_movements cm
    WHERE cm.class_generated_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY cm.movement_id, cm.movement_name
)
SELECT
    '📊 YOUR 7-DAY VARIETY REPORT' as report,
    (SELECT COUNT(*) FROM your_recent_classes) as classes_generated,
    COUNT(DISTINCT movement_id) as unique_movements_used,
    COUNT(*) as total_movement_instances,
    ROUND(COUNT(DISTINCT movement_id)::numeric / 35.0 * 100, 1) as repertoire_coverage_pct,
    ROUND(AVG(times_used), 1) as avg_uses_per_movement,
    MAX(times_used) as max_times_any_movement_used,
    (SELECT movement_name FROM your_movements WHERE times_used = (SELECT MAX(times_used) FROM your_movements) LIMIT 1) as most_used_movement
FROM your_movements;

-- ================================================================
-- 2. MOVEMENT FREQUENCY DISTRIBUTION
-- ================================================================

SELECT
    '📈 FREQUENCY DISTRIBUTION' as category,
    times_used,
    COUNT(*) as movements_at_this_frequency,
    STRING_AGG(movement_name, ', ' ORDER BY movement_name) as movements
FROM (
    SELECT
        cm.movement_name,
        COUNT(*) as times_used
    FROM class_movements cm
    WHERE cm.class_generated_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY cm.movement_name
) usage_stats
GROUP BY times_used
ORDER BY times_used DESC;

-- ================================================================
-- 3. IDENTIFY OVERUSED MOVEMENTS (Red Flags)
-- ================================================================

WITH usage_stats AS (
    SELECT
        cm.movement_name,
        COUNT(*) as times_used,
        COUNT(DISTINCT DATE(cm.class_generated_at)) as days_used
    FROM class_movements cm
    WHERE cm.class_generated_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY cm.movement_name
)
SELECT
    '⚠️ OVERUSED' as flag,
    movement_name,
    times_used,
    days_used,
    ROUND(times_used::numeric /
          (SELECT COUNT(DISTINCT DATE(class_generated_at))
           FROM class_movements
           WHERE class_generated_at >= CURRENT_DATE - INTERVAL '7 days'), 1) as avg_per_day
FROM usage_stats
WHERE times_used >= 5  -- Used 5+ times in a week
ORDER BY times_used DESC;

-- ================================================================
-- 4. IDENTIFY NEGLECTED MOVEMENTS (Opportunities)
-- ================================================================

SELECT
    '❌ NEVER USED IN 7 DAYS' as status,
    m.name as movement_name,
    m.difficulty_level,
    COALESCE(
        (SELECT MAX(cm.class_generated_at)::date
         FROM class_movements cm
         WHERE cm.movement_id = m.id),
        'Never used'::text
    ) as last_used_date
FROM movements m
WHERE NOT EXISTS (
    SELECT 1
    FROM class_movements cm
    WHERE cm.movement_id = m.id
    AND cm.class_generated_at >= CURRENT_DATE - INTERVAL '7 days'
)
ORDER BY m.difficulty_level, m.name
LIMIT 20;

-- ================================================================
-- 5. DIFFICULTY LEVEL VARIETY CHECK
-- ================================================================

WITH difficulty_stats AS (
    SELECT
        m.difficulty_level,
        COUNT(DISTINCT m.id) as total_movements_available,
        COUNT(DISTINCT cm.movement_id) as unique_movements_used,
        COUNT(cm.movement_id) as total_uses
    FROM movements m
    LEFT JOIN class_movements cm ON m.id = cm.movement_id
        AND cm.class_generated_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY m.difficulty_level
)
SELECT
    '🎯 BY DIFFICULTY' as category,
    difficulty_level,
    total_movements_available,
    unique_movements_used,
    ROUND(unique_movements_used::numeric / total_movements_available * 100, 1) as coverage_pct,
    total_uses,
    CASE
        WHEN unique_movements_used::numeric / total_movements_available < 0.3 THEN '❌ Poor variety'
        WHEN unique_movements_used::numeric / total_movements_available < 0.5 THEN '⚠️ Limited variety'
        WHEN unique_movements_used::numeric / total_movements_available < 0.7 THEN '✅ Good variety'
        ELSE '🌟 Excellent variety'
    END as assessment
FROM difficulty_stats
ORDER BY
    CASE difficulty_level
        WHEN 'Beginner' THEN 1
        WHEN 'Intermediate' THEN 2
        WHEN 'Advanced' THEN 3
    END;

-- ================================================================
-- 6. THE HUNDRED CHECK (Special Case)
-- ================================================================

SELECT
    '🎯 THE HUNDRED USAGE' as check_type,
    COUNT(*) as times_used_this_week,
    COUNT(DISTINCT DATE(cm.class_generated_at)) as days_appeared,
    ROUND(COUNT(*)::numeric /
          NULLIF((SELECT COUNT(DISTINCT id) FROM class_history
                  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'), 0) * 100, 1) as pct_of_classes,
    CASE
        WHEN COUNT(*) > 7 THEN '⚠️ Overused (appearing too often)'
        WHEN COUNT(*) BETWEEN 3 AND 7 THEN '✅ Good (foundational but not excessive)'
        WHEN COUNT(*) BETWEEN 1 AND 2 THEN '👍 Light use'
        ELSE '❌ Not used (consider adding for beginners)'
    END as assessment
FROM class_movements cm
WHERE LOWER(cm.movement_name) LIKE '%hundred%'
  AND cm.class_generated_at >= CURRENT_DATE - INTERVAL '7 days';

-- ================================================================
-- 7. RECOMMENDATIONS BASED ON DATA
-- ================================================================

SELECT
    '💡 RECOMMENDATION' as category,
    CASE
        WHEN (SELECT COUNT(DISTINCT movement_id) FROM class_movements
              WHERE class_generated_at >= CURRENT_DATE - INTERVAL '7 days') < 10
        THEN 'Very low variety detected. Check if movement selection is stuck on same few movements.'

        WHEN (SELECT MAX(count) FROM (
              SELECT COUNT(*) as count FROM class_movements
              WHERE class_generated_at >= CURRENT_DATE - INTERVAL '7 days'
              GROUP BY movement_id) counts) > 7
        THEN 'Some movements are overused. The variety algorithm may need adjustment.'

        WHEN (SELECT COUNT(*) FROM movements m
              WHERE NOT EXISTS (
                  SELECT 1 FROM class_movements cm
                  WHERE cm.movement_id = m.id
                  AND cm.class_generated_at >= CURRENT_DATE - INTERVAL '30 days')) > 15
        THEN 'Many movements unused for 30+ days. Historical variety enforcement may be too weak.'

        ELSE 'Variety appears reasonable. Continue monitoring weekly.'
    END as recommendation;

-- ================================================================
-- HOW TO USE THIS REPORT
-- ================================================================
-- 1. Run all queries in Supabase SQL Editor
-- 2. Look for these warning signs:
--    - Repertoire coverage < 30% (too narrow)
--    - Any movement used 7+ times in a week
--    - More than 50% of movements never used
--    - The Hundred appearing in >50% of classes
-- 3. If issues found, apply the improvements in variety_improvements.py