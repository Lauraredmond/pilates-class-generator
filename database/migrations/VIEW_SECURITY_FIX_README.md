# Fixing Supabase SECURITY DEFINER View Warnings

## The Real Issue

The Supabase Security Advisor warnings are about **VIEWS**, not functions. The 6 views listed below were created with **SECURITY DEFINER** behavior, which means they run with the view owner's permissions instead of the querying user's permissions.

**Views with warnings:**
- `early_skip_statistics`
- `movement_skip_leaderboard`
- `platform_quality_metrics`
- `section_type_skip_summary`
- `user_play_statistics`
- `user_quality_statistics`

## What This Migration Does

**Migration 021** recreates all 6 views with `WITH (security_invoker = true)`, which makes them run with the **querying user's permissions** (safer).

**Before:**
```sql
CREATE VIEW user_play_statistics AS ...
-- Runs with owner permissions (SECURITY DEFINER behavior)
```

**After:**
```sql
CREATE VIEW user_play_statistics
WITH (security_invoker = true)
AS ...
-- Runs with querying user permissions (SECURITY INVOKER behavior)
```

## How to Apply

### Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Click **SQL Editor**
3. Open the file: `database/migrations/021_fix_view_security_definer.sql`
4. Copy the entire contents
5. Paste into SQL Editor
6. Click **Run**
7. Verify: "Success. No rows returned" (normal for DDL statements)

### Expected Output

You should see no errors. The migration will:
1. Drop each view (CASCADE to handle dependencies)
2. Recreate each view with `security_invoker = true`
3. Grant SELECT permissions to authenticated users

## After Applying

1. **Refresh Security Advisor** in Supabase dashboard
2. The 6 "Security Definer View" warnings should disappear
3. All views should still work exactly the same
4. Queries will now run with the user's permissions (safer)

## Testing

After migration, verify views work:

```sql
-- Test each view
SELECT * FROM early_skip_statistics LIMIT 5;
SELECT * FROM movement_skip_leaderboard LIMIT 5;
SELECT * FROM platform_quality_metrics LIMIT 5;
SELECT * FROM section_type_skip_summary LIMIT 5;
SELECT * FROM user_play_statistics LIMIT 5;
SELECT * FROM user_quality_statistics LIMIT 5;
```

All should return data without errors.

## Why This Is Important

**SECURITY DEFINER views:**
- Run with owner's permissions (often superuser)
- Bypass Row Level Security (RLS)
- Can expose data users shouldn't see
- Security risk if not carefully managed

**SECURITY INVOKER views:**
- Run with querying user's permissions
- Respect RLS policies
- Only show data user has access to
- Much safer default

## Notes

- Migration 020 was for **functions** (already correct in most environments)
- Migration 021 is for **views** (the actual issue from screenshot)
- Views must be dropped and recreated (ALTER VIEW doesn't support changing security)
- CASCADE ensures dependent objects are recreated properly