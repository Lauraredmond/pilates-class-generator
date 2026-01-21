# Fixing Supabase Security Definer Warnings

## What are Security Definer Warnings?

When you see "Security Definer View" warnings in Supabase Security Advisor, it means your database has functions or views that run with elevated privileges (the owner's permissions) rather than the calling user's permissions.

### Why is this a security concern?

- **SECURITY DEFINER** = Function runs with OWNER privileges (like running as admin)
- **SECURITY INVOKER** = Function runs with CALLER privileges (safer default)

Using SECURITY DEFINER when not needed can expose your database to privilege escalation attacks.

## What this migration does

Migration `020_fix_security_definer_warnings.sql` fixes these issues by:

1. **Changes 7 functions to SECURITY INVOKER** (safer):
   - `calculate_movement_novelty_score`
   - `check_consecutive_muscle_overuse`
   - `check_pregnancy_exclusion`
   - `get_user_movement_history`
   - `select_cooldown_by_muscle_groups`
   - `select_warmup_by_muscle_groups`
   - `validate_required_elements`

2. **Keeps 5 functions as SECURITY DEFINER** (required for triggers):
   - `log_pregnancy_detection` (needs write access for logging)
   - `update_beta_feedback_updated_at` (trigger function)
   - `update_music_playlists_updated_at` (trigger function)
   - `update_music_tracks_updated_at` (trigger function)
   - `update_updated_at_column` (trigger function)

3. **Recreates 6 views without SECURITY DEFINER**:
   - `early_skip_statistics`
   - `movement_skip_leaderboard`
   - `platform_quality_metrics`
   - `section_type_skip_summary`
   - `user_play_statistics`
   - `user_quality_statistics`

## How to Apply the Migration

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `020_fix_security_definer_warnings.sql`
4. Paste and click **Run**
5. Check the output for any errors

### Option 2: Via Supabase CLI

```bash
cd database
supabase db push --file migrations/020_fix_security_definer_warnings.sql
```

## Testing After Migration

Run these verification queries in SQL Editor:

```sql
-- Check functions security settings
SELECT
    proname as function_name,
    CASE WHEN prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security_type
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
ORDER BY prosecdef DESC, proname;

-- Check views are accessible
SELECT viewname FROM pg_views WHERE schemaname = 'public';

-- Test a function (should work with user permissions)
SELECT check_pregnancy_exclusion('your-user-id-here', 'movement-id-here');

-- Test a view (should return data)
SELECT * FROM platform_quality_metrics;
```

## Expected Results

After applying the migration:

1. **Security Advisor should show fewer or no warnings**
2. **All functions should still work** (but with caller's permissions)
3. **Views should be accessible** to authenticated users
4. **Trigger functions continue working** (they keep SECURITY DEFINER)

## Rollback (if needed)

If something breaks, you can rollback by setting functions back to SECURITY DEFINER:

```sql
-- Example rollback for one function
ALTER FUNCTION check_pregnancy_exclusion(uuid, uuid) SECURITY DEFINER;
```

## Why Some Functions Keep SECURITY DEFINER

**Trigger functions** must have SECURITY DEFINER because:
- They update system columns (like `updated_at`)
- They're invoked automatically by the database
- They need consistent permissions regardless of who triggers them

**Logging functions** keep SECURITY DEFINER because:
- They write to audit/log tables
- Regular users shouldn't have direct write access to logs
- They need elevated privileges to maintain audit integrity

## Questions?

If you encounter issues:
1. Check the Supabase logs for specific errors
2. Verify your user has proper permissions
3. Test functions individually to isolate problems
4. Consider keeping SECURITY DEFINER for functions that legitimately need it