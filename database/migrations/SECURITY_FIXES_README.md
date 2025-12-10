# Supabase Security Fixes - Execution Guide

**Date:** December 10, 2025
**Priority:** CRITICAL - Execute ASAP

---

## 📊 Summary of Security Issues

| Priority | Issue Type | Count | Risk Level |
|----------|------------|-------|------------|
| **CRITICAL** | RLS Disabled on Public Tables | 10 tables | ⛔ ERROR |
| **HIGH** | Function Search Path Mutable | 15 functions | ⚠️ WARN |
| **MEDIUM** | Leaked Password Protection Disabled | 1 setting | ⚠️ WARN |
| **LOW** | RLS Enabled but No Policies | 2 tables | ℹ️ INFO |

**Total Issues:** 28 security warnings

---

## 🚀 Execution Plan (Follow in Order)

### **Step 1: CRITICAL - Enable RLS on 10 Public Tables**

**File:** `023_enable_rls_on_public_tables.sql`

**What It Fixes:**
- Enables Row Level Security on 10 tables that are currently publicly accessible
- Creates appropriate RLS policies for user data and reference data
- Prevents unauthorized access to user profiles, preferences, and medical data

**Affected Tables:**
1. `user_profiles` - Users can only access their own profile
2. `user_preferences` - Users can only access their own preferences
3. `medical_exclusions_log` - Users can only view their own medical logs
4. `warmup_routines` - Read-only for all authenticated users
5. `cooldown_sequences` - Read-only for all authenticated users
6. `closing_meditation_scripts` - Read-only for all authenticated users
7. `closing_homecare_advice` - Read-only for all authenticated users
8. `movement_levels` - Read-only for all authenticated users
9. `preparation_scripts` - Read-only for all authenticated users
10. `pii_field_registry` - Admin/service role only

**How to Execute:**
1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy entire contents of `023_enable_rls_on_public_tables.sql`
4. Paste into query editor
5. Click "Run" button
6. Verify success (no errors in output)

**Verification Query:**
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profiles', 'user_preferences', 'medical_exclusions_log',
    'warmup_routines', 'cooldown_sequences', 'pii_field_registry',
    'closing_meditation_scripts', 'closing_homecare_advice',
    'movement_levels', 'preparation_scripts'
  );
```
**Expected Result:** All 10 tables show `rowsecurity = true`

---

### **Step 2: HIGH - Fix Function Search Paths**

**File:** `024_fix_function_search_paths.sql`

**What It Fixes:**
- Adds `SECURITY DEFINER` and `SET search_path = ''` to 14 functions
- Prevents SQL injection via schema hijacking attacks
- Uses fully qualified names (schema.table) in function bodies

**Affected Functions:**
1. `calculate_movement_novelty_score`
2. `calculate_playlist_duration`
3. `update_music_tracks_updated_at`
4. `update_music_playlists_updated_at`
5. `check_pregnancy_exclusion`
6. `log_pregnancy_detection`
7. `update_beta_feedback_updated_at`
8. `get_playlist_with_tracks`
9. `validate_required_elements`
10. `select_warmup_by_muscle_groups`
11. `select_cooldown_by_muscle_groups`
12. `update_updated_at_column`
13. `get_user_movement_history`
14. `check_consecutive_muscle_overuse`

**Note:** Function #15 was not visible in the CSV export. Re-run Supabase linter after this migration to identify if there's a 15th function.

**How to Execute:**
1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy entire contents of `024_fix_function_search_paths.sql`
4. Paste into query editor
5. Click "Run" button
6. Verify success (no errors in output)

**Verification Query:**
```sql
SELECT
  proname as function_name,
  prosecdef as is_security_definer,
  proconfig as search_path_config
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'calculate_movement_novelty_score',
    'calculate_playlist_duration',
    'update_music_tracks_updated_at',
    'update_music_playlists_updated_at',
    'check_pregnancy_exclusion',
    'log_pregnancy_detection',
    'update_beta_feedback_updated_at',
    'get_playlist_with_tracks',
    'validate_required_elements',
    'select_warmup_by_muscle_groups',
    'select_cooldown_by_muscle_groups',
    'update_updated_at_column',
    'get_user_movement_history',
    'check_consecutive_muscle_overuse'
  );
```
**Expected Result:** All 14 functions show `is_security_definer = true` and `search_path_config = {search_path=''}`

---

### **Step 3: MEDIUM - Enable Leaked Password Protection**

**File:** NO SQL FILE - Dashboard Setting

**What It Fixes:**
- Enables checking user passwords against HaveIBeenPwned.org database
- Prevents users from using passwords that have been leaked in data breaches
- Reduces risk of credential stuffing attacks

**How to Enable:**

#### **Option A: Try Authentication → Settings First**
1. Go to Supabase Dashboard
2. Click **"Authentication"** in left sidebar
3. Click **"Settings"** tab (NOT "Policies")
4. Scroll down to find **"Password Security"** section
5. Look for toggle: **"Enable Leaked Password Protection"**
6. Turn it ON
7. Save changes

#### **Option B: If Not Found in Auth → Settings, Try Project Settings**
1. Go to Supabase Dashboard
2. Click **"Project Settings"** (gear icon at bottom left)
3. Click **"Auth"** in the settings sidebar
4. Scroll to find **"Password Protection"** or **"Security"** section
5. Look for toggle: **"Check passwords against HaveIBeenPwned"**
6. Turn it ON
7. Save changes

#### **Option C: If Still Not Found (Alternative API Approach)**
If the toggle doesn't exist in your Supabase dashboard (older version), you can enable it via SQL:

```sql
-- This may or may not work depending on your Supabase version
-- Check Supabase documentation for your specific version
ALTER SYSTEM SET auth.password_breach_check TO 'on';
```

**Note:** If you still can't find this setting, take a screenshot of your Authentication → Settings page and we'll troubleshoot.

---

### **Step 4: LOW - Add RLS Policies to Compliance Tables**

**File:** `025_add_rls_policies_compliance_tables.sql`

**What It Fixes:**
- Adds RLS policies to `bias_monitoring` and `model_drift_log` tables
- Documents that these tables are service-role-only access
- Resolves info-level warnings

**Affected Tables:**
1. `bias_monitoring` - Service role can insert/read only
2. `model_drift_log` - Service role can insert/read only

**How to Execute:**
1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy entire contents of `025_add_rls_policies_compliance_tables.sql`
4. Paste into query editor
5. Click "Run" button
6. Verify success (no errors in output)

**Verification Query:**
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('bias_monitoring', 'model_drift_log')
ORDER BY tablename, policyname;
```
**Expected Result:** 4 policies total (2 per table: INSERT and SELECT)

---

## ✅ Final Verification

After executing all steps, run the Supabase Performance Advisor / Security Linter again:

1. Go to Supabase Dashboard
2. Click **"Advisors"** or **"Database"** → **"Advisors"** (location varies by version)
3. Click **"Run Linter"** or **"Refresh"**
4. Export results as CSV

**Expected Results:**
- ⛔ ERROR count: **0** (was 10)
- ⚠️ WARN count: **1** (was 16) - Only leaked password protection if not enabled
- ℹ️ INFO count: **0** (was 2)

---

## 🚨 Troubleshooting

### **Issue: Migration Fails with "Policy Already Exists"**
**Solution:** Policies may have been partially created. Drop existing policies first:
```sql
-- List existing policies
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Drop specific policy if needed
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

### **Issue: RLS Breaks Application Functionality**
**Symptom:** Users can't access data they should be able to access
**Solution:** Check policy definitions. Most common issue is wrong `auth.uid()` comparison.

**Debug Query:**
```sql
-- Check what auth.uid() returns for current user
SELECT auth.uid();

-- Check if user_id matches in user_profiles
SELECT user_id FROM user_profiles WHERE user_id = auth.uid();
```

### **Issue: Can't Find Leaked Password Protection Setting**
**Solution:** This setting location varies by Supabase version. Try:
1. Authentication → Settings → Password Security
2. Project Settings → Auth → Password Protection
3. If neither work, drop a note in Supabase Discord for your specific version

---

## 📝 Post-Migration Checklist

- [ ] Step 1 executed: RLS enabled on 10 tables
- [ ] Step 1 verified: All 10 tables show `rowsecurity = true`
- [ ] Step 2 executed: Function search paths fixed
- [ ] Step 2 verified: All 14 functions have `search_path = ''`
- [ ] Step 3 executed: Leaked password protection enabled
- [ ] Step 4 executed: RLS policies added to compliance tables
- [ ] Step 4 verified: 4 policies exist for 2 tables
- [ ] Final verification: Re-run Supabase linter
- [ ] Final verification: Export results CSV
- [ ] Application testing: Verify app still works correctly
- [ ] User testing: Test login, profile editing, class generation

---

## 🔄 Rollback Plan (Emergency Only)

If something breaks and you need to revert:

**Rollback RLS (Step 1):**
```sql
-- Disable RLS on all 10 tables
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE medical_exclusions_log DISABLE ROW LEVEL SECURITY;
-- ... repeat for all 10 tables
```

**Rollback Functions (Step 2):**
- Restore from previous database backup, OR
- Re-create functions without `SECURITY DEFINER` / `SET search_path`

**Rollback Auth (Step 3):**
- Go back to dashboard and toggle OFF

**Rollback Compliance Policies (Step 4):**
```sql
DROP POLICY IF EXISTS "Service role can insert bias monitoring records" ON bias_monitoring;
DROP POLICY IF EXISTS "Service role can read bias monitoring records" ON bias_monitoring;
DROP POLICY IF EXISTS "Service role can insert model drift records" ON model_drift_log;
DROP POLICY IF EXISTS "Service role can read model drift records" ON model_drift_log;
```

---

## 📞 Support

If you encounter issues:
1. Check Supabase documentation: https://supabase.com/docs/guides/database/postgres/row-level-security
2. Review migration SQL comments (detailed explanations included)
3. Test with verification queries provided above
4. Check application logs for RLS policy violations
