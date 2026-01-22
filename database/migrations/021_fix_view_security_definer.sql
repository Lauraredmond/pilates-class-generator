-- Migration 021: Fix SECURITY DEFINER Views
-- This migration recreates views with SECURITY INVOKER to fix Supabase Security Advisor warnings
-- SECURITY INVOKER views run with the permissions of the querying user (safer)

-- ============================================
-- DROP AND RECREATE VIEWS WITH SECURITY INVOKER
-- ============================================

-- 1. early_skip_statistics
DROP VIEW IF EXISTS early_skip_statistics CASCADE;
CREATE VIEW early_skip_statistics
WITH (security_invoker = true)
AS
SELECT
    section_type,
    movement_id,
    movement_name,
    count(*) AS total_plays,
    count(*) FILTER (WHERE (is_early_skip = true)) AS early_skips,
    count(*) FILTER (WHERE (is_early_skip = false)) AS completed_plays,
    round(((((count(*) FILTER (WHERE (is_early_skip = true)))::double precision / (count(*))::double precision) * (100)::double precision))::numeric, 1) AS early_skip_rate_pct,
    round(avg(duration_seconds), 1) AS avg_duration_seconds,
    round(avg(planned_duration_seconds), 1) AS avg_planned_duration,
    round((min(duration_seconds))::numeric, 1) AS min_duration_seconds,
    round((max(duration_seconds))::numeric, 1) AS max_duration_seconds,
    round(((avg(duration_seconds) / avg(planned_duration_seconds)) * (100)::numeric), 1) AS avg_completion_pct,
    min(started_at) AS first_play,
    max(started_at) AS last_play,
    count(DISTINCT play_session_id) AS unique_sessions,
    count(DISTINCT user_id) AS unique_users
FROM playback_section_events
WHERE (ended_at IS NOT NULL)
GROUP BY section_type, movement_id, movement_name
HAVING (count(*) >= 1)
ORDER BY (round(((((count(*) FILTER (WHERE (is_early_skip = true)))::double precision / (count(*))::double precision) * (100)::double precision))::numeric, 1)) DESC, (count(*)) DESC;

-- 2. movement_skip_leaderboard
DROP VIEW IF EXISTS movement_skip_leaderboard CASCADE;
CREATE VIEW movement_skip_leaderboard
WITH (security_invoker = true)
AS
SELECT
    movement_id,
    movement_name,
    count(*) AS total_plays,
    count(*) FILTER (WHERE (is_early_skip = true)) AS early_skips,
    round(((((count(*) FILTER (WHERE (is_early_skip = true)))::double precision / (count(*))::double precision) * (100)::double precision))::numeric, 1) AS early_skip_rate_pct,
    round(avg(duration_seconds), 1) AS avg_duration_seconds,
    round(avg(planned_duration_seconds), 1) AS avg_planned_duration
FROM playback_section_events
WHERE (((section_type)::text = 'movement'::text) AND (ended_at IS NOT NULL) AND (movement_id IS NOT NULL))
GROUP BY movement_id, movement_name
HAVING (count(*) >= 10)
ORDER BY (round(((((count(*) FILTER (WHERE (is_early_skip = true)))::double precision / (count(*))::double precision) * (100)::double precision))::numeric, 1)) DESC, (count(*)) DESC
LIMIT 20;

-- 3. platform_quality_metrics
DROP VIEW IF EXISTS platform_quality_metrics CASCADE;
CREATE VIEW platform_quality_metrics
WITH (security_invoker = true)
AS
SELECT
    date(generated_at) AS date,
    count(*) AS classes_generated,
    count(*) FILTER (WHERE (overall_pass = true)) AS classes_passed,
    round(((((count(*) FILTER (WHERE (overall_pass = true)))::double precision / (count(*))::double precision) * (100)::double precision))::numeric, 1) AS pass_rate_pct,
    count(*) FILTER (WHERE (NOT rule1_muscle_repetition_pass)) AS rule1_failures,
    count(*) FILTER (WHERE (NOT rule2_family_balance_pass)) AS rule2_failures,
    count(*) FILTER (WHERE (NOT rule3_repertoire_coverage_pass)) AS rule3_failures,
    round((avg(quality_score))::numeric, 3) AS avg_quality_score
FROM class_quality_log
GROUP BY (date(generated_at))
ORDER BY (date(generated_at)) DESC;

-- 4. section_type_skip_summary
DROP VIEW IF EXISTS section_type_skip_summary CASCADE;
CREATE VIEW section_type_skip_summary
WITH (security_invoker = true)
AS
SELECT
    section_type,
    count(*) AS total_plays,
    count(*) FILTER (WHERE (is_early_skip = true)) AS early_skips,
    round(((((count(*) FILTER (WHERE (is_early_skip = true)))::double precision / (count(*))::double precision) * (100)::double precision))::numeric, 1) AS early_skip_rate_pct,
    round(avg(duration_seconds), 1) AS avg_duration_seconds,
    count(DISTINCT user_id) AS unique_users
FROM playback_section_events
WHERE (ended_at IS NOT NULL)
GROUP BY section_type
ORDER BY (round(((((count(*) FILTER (WHERE (is_early_skip = true)))::double precision / (count(*))::double precision) * (100)::double precision))::numeric, 1)) DESC;

-- 5. user_play_statistics
DROP VIEW IF EXISTS user_play_statistics CASCADE;
CREATE VIEW user_play_statistics
WITH (security_invoker = true)
AS
SELECT
    u.id AS user_id,
    u.email,
    count(DISTINCT ps.id) AS total_sessions,
    count(DISTINCT ps.id) FILTER (WHERE (ps.is_qualified_play = true)) AS qualified_plays,
    count(DISTINCT ps.id) FILTER (WHERE (ps.was_completed = true)) AS completed_classes,
    count(DISTINCT ps.class_plan_id) AS unique_classes_played,
    COALESCE(sum(ps.duration_seconds), (0)::bigint) AS total_play_seconds,
    COALESCE(avg(ps.duration_seconds), (0)::numeric) AS avg_play_seconds,
    COALESCE(max(ps.duration_seconds), 0) AS longest_session_seconds,
    min(ps.started_at) AS first_play_date,
    max(ps.started_at) AS last_play_date,
    COALESCE(avg(ps.pause_count), (0)::numeric) AS avg_pauses_per_session,
    CASE
        WHEN (count(ps.id) FILTER (WHERE (ps.is_qualified_play = true)) > 0) THEN (((count(ps.id) FILTER (WHERE (ps.was_completed = true)))::double precision / (count(ps.id) FILTER (WHERE (ps.is_qualified_play = true)))::double precision) * (100)::double precision)
        ELSE (0)::double precision
    END AS completion_rate_percentage
FROM (user_profiles u
    LEFT JOIN class_play_sessions ps ON ((u.id = ps.user_id)))
GROUP BY u.id, u.email;

-- 6. user_quality_statistics
DROP VIEW IF EXISTS user_quality_statistics CASCADE;
CREATE VIEW user_quality_statistics
WITH (security_invoker = true)
AS
SELECT
    user_id,
    count(*) AS total_classes_generated,
    count(*) FILTER (WHERE (overall_pass = true)) AS classes_passed,
    count(*) FILTER (WHERE (overall_pass = false)) AS classes_failed,
    round(((((count(*) FILTER (WHERE (overall_pass = true)))::double precision / (count(*))::double precision) * (100)::double precision))::numeric, 1) AS pass_rate_pct,
    round(((((count(*) FILTER (WHERE (rule1_muscle_repetition_pass = true)))::double precision / (count(*))::double precision) * (100)::double precision))::numeric, 1) AS rule1_pass_rate,
    round(((((count(*) FILTER (WHERE (rule2_family_balance_pass = true)))::double precision / (count(*))::double precision) * (100)::double precision))::numeric, 1) AS rule2_pass_rate,
    round(((((count(*) FILTER (WHERE (rule3_repertoire_coverage_pass = true)))::double precision / (count(*))::double precision) * (100)::double precision))::numeric, 1) AS rule3_pass_rate,
    round((avg(quality_score))::numeric, 3) AS avg_quality_score,
    round((avg(rule1_max_consecutive_overlap_pct))::numeric, 1) AS avg_consecutive_overlap,
    round((avg(rule2_max_family_pct))::numeric, 1) AS avg_max_family_pct,
    round(avg(rule3_unique_movements_count), 0) AS avg_unique_movements,
    min(generated_at) AS first_class_date,
    max(generated_at) AS most_recent_class_date
FROM class_quality_log
GROUP BY user_id;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT ON early_skip_statistics TO authenticated;
GRANT SELECT ON movement_skip_leaderboard TO authenticated;
GRANT SELECT ON platform_quality_metrics TO authenticated;
GRANT SELECT ON section_type_skip_summary TO authenticated;
GRANT SELECT ON user_play_statistics TO authenticated;
GRANT SELECT ON user_quality_statistics TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================

-- After running this migration, verify with:
-- SELECT viewname FROM pg_views WHERE schemaname = 'public' ORDER BY viewname;

COMMENT ON SCHEMA public IS 'Migration 021 applied: Fixed SECURITY DEFINER views with SECURITY INVOKER';