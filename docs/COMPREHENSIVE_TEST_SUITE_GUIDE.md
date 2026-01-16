# Comprehensive Test Suite Guide

**Created:** January 16, 2026
**Purpose:** E2E testing for Chromecast, Analytics, Admin Features, and AI Toggle Access Control

---

## Overview

The comprehensive test suite (`comprehensive-app-test.spec.ts`) validates:

1. **✅ Chromecast Icon State** - Icon should be WHITE/ACTIVE (not greyed out) after CSP fix
2. **✅ Analytics Page** - Class count increments correctly after class generation
3. **✅ Admin-Only LLM Logs** - Developer tools visible only to admin users
4. **✅ AI Toggle Access** - AI toggle visible only to admins, defaults to OFF
5. **✅ Settings/Developer Tools** - Admin statistics for all users (admin only)

---

## Prerequisites

### 1. Test Users Setup

You need **TWO test users** in your Supabase database:

#### **Regular User** (No Admin Access)
```sql
-- Check if regular test user exists
SELECT id, email, is_admin FROM user_profiles WHERE email = 'test@example.com';

-- If missing is_admin column, add it:
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create or update regular user
INSERT INTO user_profiles (id, email, is_admin)
VALUES (
  '[user-id-from-auth.users]',
  'test@example.com',
  false
)
ON CONFLICT (id) DO UPDATE
SET is_admin = false;
```

#### **Admin User** (Full Admin Access)
```sql
-- Create or update admin user
INSERT INTO user_profiles (id, email, is_admin)
VALUES (
  '[admin-user-id-from-auth.users]',
  'admin@example.com',
  true  -- ← ADMIN FLAG
)
ON CONFLICT (id) DO UPDATE
SET is_admin = true;
```

**Important Notes:**
- User IDs must match the corresponding entries in `auth.users` table (Supabase Auth)
- Both users must have completed signup via the app (password stored in `auth.users`)
- `is_admin` field is a new column - add it to `user_profiles` if it doesn't exist

### 2. Environment Variables

Create `frontend/.env.test` (this file is gitignored):

```bash
# Regular user credentials
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=YourTestPassword123!

# Admin user credentials
ADMIN_USER_EMAIL=admin@example.com
ADMIN_USER_PASSWORD=YourAdminPassword123!
```

**Security:**
- `.env.test` is in `.gitignore` - never commit this file
- Use strong passwords for both accounts
- These credentials are for testing only

### 3. Chromecast Device (Optional for Icon Tests)

For Chromecast icon tests to pass with WHITE/ACTIVE state:
- ✅ Chromecast device powered on
- ✅ Chromecast and test machine on same WiFi network
- ✅ CSP fix deployed (commit d3391bbd)

If no Chromecast available:
- Icon will still be greyed out
- Test will FAIL but with clear error message explaining why
- This documents expected behavior once CSP fix is deployed

---

## Running the Tests

### Full Comprehensive Suite

```bash
cd frontend
npm run test:e2e:comprehensive
```

**What This Tests:**
- ✅ Chromecast icon state (expects WHITE/ACTIVE after CSP fix)
- ✅ Analytics page class count incrementation
- ✅ Admin-only LLM logs visibility (regular user should NOT see)
- ✅ Admin-only LLM logs visibility (admin user SHOULD see)
- ✅ AI toggle hidden from regular users
- ✅ AI toggle visible to admins (defaults to OFF)
- ✅ Settings page admin sections (if implemented)

### Run on Dev Environment Only

```bash
npm run test:e2e:comprehensive:dev
```

### Run Individual Test Suites

```bash
# Chromecast only
npx playwright test comprehensive-app-test.spec.ts --grep "Chromecast Integration"

# Analytics page only
npx playwright test comprehensive-app-test.spec.ts --grep "Analytics Page"

# Admin LLM logs only
npx playwright test comprehensive-app-test.spec.ts --grep "Admin LLM Logs"

# AI toggle access control only
npx playwright test comprehensive-app-test.spec.ts --grep "AI Toggle"

# Developer tools only
npx playwright test comprehensive-app-test.spec.ts --grep "Developer Tools"
```

---

## Test Details

### Test 1: Chromecast Icon State

**What It Tests:**
- Logs in as regular user
- Generates/accepts a class
- Starts class playback
- Checks CastButton component state

**Expected Result:**
- ✅ Icon is WHITE/ACTIVE (not greyed out)
- ✅ `aria-label` is "Cast to TV" or "Connected to TV" (NOT "No Cast devices found")
- ✅ Button is enabled (not disabled)
- ✅ No cursor-not-allowed styling

**If Test Fails:**
```
❌ CHROMECAST ICON IS GREYED OUT

Possible causes:
1. CSP fix not deployed yet
2. Browser cache needs clearing (old CSP headers)
3. No Chromecast on test network
4. Chromecast powered off
```

**How to Debug:**
- Check if CSP fix (commit d3391bbd) is deployed
- Clear browser cache completely
- Verify Chromecast is on and same network
- Check console for CSP errors

---

### Test 2: Analytics Page - Class Count Incrementation

**What It Tests:**
- Logs in as regular user
- Navigates to Analytics page
- Captures initial `Total Classes` count
- Generates a new class
- Returns to Analytics page
- Verifies count incremented by +1

**Expected Result:**
- ✅ `Total Classes` increases by 1
- ✅ `+X this week` shows at least 1

**If Test Fails:**
- Check if class was actually saved to database
- Verify analytics API is working
- Check `class_history` table for new record

---

### Test 3: Admin-Only LLM Logs

**Two Sub-Tests:**

#### 3a. Regular User Should NOT See Logs
- Logs in as regular user
- Navigates to Analytics page
- Verifies "ADMIN ONLY" badge NOT visible
- Verifies "LLM Usage & Observability" section NOT visible

#### 3b. Admin User SHOULD See Logs
- Logs in as admin user
- Navigates to Analytics page
- Scrolls to bottom
- Verifies "ADMIN ONLY" badge IS visible
- Verifies "LLM Usage & Observability" section IS visible
- Verifies stats: "Total Invocations", "AI Agent Calls", "Estimated Cost"

**Expected Result:**
- ✅ Regular users see NO admin sections
- ✅ Admin users see all admin sections

**If Test Fails:**
- Check `user_profiles.is_admin` column exists
- Verify admin user has `is_admin = true`
- Check `useAuth()` hook returns `user.is_admin` correctly

---

### Test 4: AI Toggle - Admin-Only Access

**Three Sub-Tests:**

#### 4a. Regular User Should NOT See AI Toggle
- Logs in as regular user
- Navigates to class builder
- Searches for AI toggle (button with "AI" text)
- Verifies toggle NOT visible

#### 4b. Admin User SHOULD See AI Toggle
- Logs in as admin user
- Navigates to class builder
- Searches for AI toggle
- Verifies toggle IS visible

#### 4c. AI Toggle Defaults to OFF
- Admin user sees toggle
- Verifies `aria-checked="false"` (defaults to OFF)
- Clicks toggle
- Verifies `aria-checked="true"` (admin CAN enable it)

**Expected Result:**
- ✅ Regular users: No AI toggle visible
- ✅ Admin users: AI toggle visible, defaults to OFF
- ✅ Admin CAN toggle it ON (not disabled)

**If Test Fails:**
- Check if AI toggle has admin-only conditional rendering
- Verify toggle defaults to `isAIMode = false`
- Check if `user.is_admin` is being passed to AIGenerationPanel component

---

### Test 5: Developer Tools / Settings

**What It Tests:**
- Logs in as admin user
- Navigates to Settings page
- Looks for admin-only sections:
  - "Developer Tools"
  - "Admin Settings"
  - "System Statistics"

**Expected Result:**
- ✅ Admin users see developer tools sections in Settings
- (Note: If not implemented yet, test documents expected behavior)

**If Test Fails:**
- Check if Settings page has admin-only sections implemented
- Verify conditional rendering based on `user.is_admin`

---

## Database Setup Commands

### Add `is_admin` Column to user_profiles

```sql
-- Add is_admin column if it doesn't exist
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Verify column added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name = 'is_admin';
```

### Create Admin User

```sql
-- Step 1: Get user ID from auth.users
SELECT id, email FROM auth.users WHERE email = 'admin@example.com';

-- Step 2: Set is_admin flag in user_profiles
UPDATE user_profiles
SET is_admin = true
WHERE id = '[user-id-from-step-1]';

-- Step 3: Verify admin status
SELECT id, email, is_admin FROM user_profiles WHERE is_admin = true;
```

### Create Regular Test User

```sql
-- Regular users should have is_admin = false (default)
SELECT id, email, is_admin FROM user_profiles WHERE email = 'test@example.com';

-- If is_admin is true, set to false:
UPDATE user_profiles
SET is_admin = false
WHERE email = 'test@example.com';
```

---

## Common Issues & Solutions

### Issue 1: "Admin user does NOT see LLM logs"

**Cause:** `user.is_admin` not set or not propagating to frontend

**Solutions:**
1. Verify database: `SELECT is_admin FROM user_profiles WHERE email = 'admin@example.com'`
2. Check if `AuthContext` fetches `is_admin` field
3. Verify `useAuth()` hook returns `user.is_admin` correctly
4. Check Analytics component: `{user?.is_admin && <AdminLLMUsageLogs />}`

---

### Issue 2: "Regular user sees AI toggle"

**Cause:** AI toggle not restricted to admin users

**Solutions:**
1. Find AI toggle in `AIGenerationPanel.tsx`
2. Add conditional rendering: `{user?.is_admin && <AIToggle />}`
3. Verify `useAuth()` provides `user.is_admin` to component

---

### Issue 3: "Chromecast icon still greyed out after CSP fix"

**Cause:** Browser cached old CSP headers

**Solutions:**
1. Clear browser cache completely (not just cookies)
2. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
3. Wait 10 minutes for Netlify CDN cache to expire
4. Check Network tab in DevTools for CSP headers:
   ```
   Content-Security-Policy: ... connect-src ... https://*.google.com ...
   ```

---

### Issue 4: "Analytics count doesn't increment"

**Cause:** Class not saving to database

**Solutions:**
1. Check `class_history` table: `SELECT COUNT(*) FROM class_history WHERE user_id = '[user-id]'`
2. Verify "Accept & Add to Class" button actually saves
3. Check backend logs for save errors
4. Verify analytics API endpoint works: `GET /api/analytics/summary/{user_id}`

---

## Success Criteria

### ✅ All Tests Pass When:
- [x] Chromecast icon is WHITE/ACTIVE (not greyed out)
- [x] Analytics page increments class count correctly
- [x] Regular users do NOT see LLM logs
- [x] Admin users DO see LLM logs
- [x] Regular users do NOT see AI toggle
- [x] Admin users DO see AI toggle (defaults to OFF)
- [x] Settings page shows admin-only sections for admins

### ⚠️ Acceptable Failures:
- Chromecast icon greyed out (if no Chromecast on test network) - documents expected behavior
- Settings/Developer Tools not implemented yet - test documents expected behavior

---

## Next Steps After Tests Pass

1. **Deploy to Production:**
   - Merge CSP fix to main branch
   - Verify tests pass on production environment
   - Smoke test with real devices

2. **Create Admin User in Production:**
   ```sql
   -- In production Supabase database
   UPDATE user_profiles
   SET is_admin = true
   WHERE email = 'your-admin-email@example.com';
   ```

3. **Monitor LLM Costs:**
   - Admin user visits Analytics page
   - Checks "Estimated Cost" in LLM Usage Logs
   - Monitors AI toggle usage (should be OFF by default to save costs)

4. **Beta Testing:**
   - Provide beta testers with regular user accounts (is_admin = false)
   - Beta testers should NOT see AI toggle or LLM logs
   - Monitor analytics to track usage patterns

---

## Test Maintenance

### When to Update Tests:

1. **New Admin Features Added:**
   - Add new test case to `comprehensive-app-test.spec.ts`
   - Verify admin-only visibility

2. **AI Toggle Behavior Changes:**
   - Update test expectations if default changes
   - Update documentation

3. **Analytics Page Changes:**
   - Update selectors if UI changes
   - Verify count increment logic still works

4. **Chromecast Implementation Changes:**
   - Update icon state expectations
   - Update CSP requirements documentation

---

## Questions?

If tests are failing and you're not sure why:

1. **Check console output** - tests log detailed information
2. **Review screenshots** - tests save screenshots on failure
3. **Read error messages** - tests explain what went wrong
4. **Check database** - verify is_admin flag, class_history records
5. **Check deployment** - verify CSP fix deployed, cache cleared

**Last Updated:** January 16, 2026 14:00 GMT
