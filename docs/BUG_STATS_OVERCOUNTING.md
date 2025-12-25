# Bug Report: classes_completed Over-Counting (3× Multiplier)

**Status:** ✅ RESOLVED - Two fixes applied
**Priority:** Medium (was Critical)
**Discovered:** December 25, 2025
**Resolved:** December 25, 2025
**Affects:** User preferences analytics

---

## Summary

The `user_preferences.classes_completed` counter is incrementing **3 times per class** instead of once.

**Expected:** 5 classes generated → `classes_completed = 5`
**Actual:** 5 classes generated → `classes_completed = 15`

---

## Evidence (Test 1 - SQL Queries)

```sql
-- class_history table (source of truth)
SELECT COUNT(*) FROM class_history WHERE user_id = 'USER_ID';
-- Result: 5 records (CORRECT)

-- user_preferences table
SELECT classes_completed FROM user_preferences WHERE user_id = 'USER_ID';
-- Result: 15 (3× over-count)
```

**Ratio:** 15 ÷ 5 = **3 increments per class**

---

## Root Cause Hypotheses

### Hypothesis A: Frontend Calling `/save-completed` Multiple Times

**Likelihood:** HIGH
**Explanation:** User might be double-clicking "Accept & Add to Library" button, or React re-rendering causing duplicate API calls.

**How to Test:**
1. Open browser DevTools → Network tab
2. Generate class → Click "Accept & Add to Library" **once**
3. Filter for `/api/classes/save-completed`
4. Check if endpoint is called 3 times

**Expected Fix:** Add debouncing or disable button after first click.

---

### Hypothesis B: Backend Incrementing Multiple Times

**Likelihood:** MEDIUM
**Explanation:** Increment logic at `backend/api/classes.py:1169` might run 3 times due to:
- Transaction retry logic
- Database trigger
- Middleware running multiple times

**How to Test:**
1. Add logging before/after increment:
   ```python
   logger.info(f"BEFORE: classes_completed = {current_classes}")
   new_classes_completed = current_classes + 1
   logger.info(f"AFTER: classes_completed = {new_classes_completed}")
   ```
2. Check Render logs for duplicate log entries

---

### Hypothesis C: Multiple Generation Flows

**Likelihood:** LOW
**Explanation:** User might be generating classes through different flows:
- AI mode + DEFAULT mode
- Orchestrator + direct backend
- Each flow increments separately

**How to Test:** Check `llm_invocation_log` for multiple entries per class.

---

## Code Locations to Investigate

### Frontend: Button Click Handler
**File:** `frontend/src/components/class-builder/AIGenerationPanel.tsx`
**Search for:** "Accept & Add to Library" button
**Check:**
- Is button click debounced?
- Is button disabled after first click?
- Does React strict mode cause double-mounting?

### Backend: Increment Logic
**File:** `backend/api/classes.py`
**Line:** 1169
**Code:**
```python
new_classes_completed = current_classes + 1

# Update preferences
supabase.table('user_preferences').update({
    'classes_completed': new_classes_completed,
    ...
}).eq('user_id', request.user_id).execute()
```

**Check:**
- Is this endpoint called multiple times per request?
- Are there database triggers on `user_preferences`?
- Is there retry logic on Supabase client?

---

## Testing Plan

### Test 1: Monitor Network Requests
1. Open DevTools → Network tab
2. Generate new class
3. Click "Accept & Add to Library" ONCE
4. Count how many times `/api/classes/save-completed` is called
5. **Expected:** 1 call
6. **If 3 calls:** Frontend issue (Hypothesis A)

### Test 2: Check Backend Logs
1. Generate new class
2. Accept & add to library
3. Check Render logs for:
   ```
   ✅ Updated user preferences: classes_completed=X
   ```
4. **Expected:** 1 log entry per class
5. **If 3 entries:** Backend issue (Hypothesis B)

### Test 3: Database Transaction Isolation
1. Run SQL manually:
   ```sql
   UPDATE user_preferences
   SET classes_completed = 0
   WHERE user_id = 'USER_ID';
   ```
2. Generate 1 class
3. Query:
   ```sql
   SELECT classes_completed FROM user_preferences WHERE user_id = 'USER_ID';
   ```
4. **Expected:** 1
5. **If 3:** Backend increment issue confirmed

---

## Temporary Workaround

User can manually reset counter:

```sql
-- Count actual classes
SELECT COUNT(*) FROM class_history WHERE user_id = 'USER_ID';
-- Result: 5

-- Update user_preferences to match
UPDATE user_preferences
SET classes_completed = 5
WHERE user_id = 'USER_ID';
```

---

## Impact Assessment

**User Experience:** 🟡 MEDIUM
- Stats page shows inflated class count
- Analytics charts may be misleading
- Experience level progression incorrect (beginner/intermediate/advanced)

**Data Integrity:** 🟡 MEDIUM
- `class_history` table is correct (source of truth)
- Only `user_preferences.classes_completed` is wrong
- Can be recalculated from `class_history`

**Business Impact:** 🟢 LOW
- Analytics still work (use `class_history` not preferences)
- No billing impact
- Doesn't affect class generation functionality

---

## Related Files

- **Frontend:** `frontend/src/components/class-builder/AIGenerationPanel.tsx`
- **Backend API:** `backend/api/classes.py` (lines 1015-1242)
- **Database:** `user_preferences` table
- **Analytics:** `backend/api/analytics.py` (uses `class_history` not `classes_completed`)

---

## Resolution (December 25, 2025)

**Two Fixes Applied:**

### Fix 1: Frontend Caching (Commit 0e7dc90d)
- **Issue:** Analytics page not refetching data after class generation
- **Root Cause:** useEffect only runs on mount (user/timePeriod dependencies)
- **Solution:**
  - Extracted `fetchAnalytics()` function outside useEffect
  - Added "Refresh Stats" button to Analytics page header
  - User can manually refresh stats without logout/login
- **File Modified:** `frontend/src/pages/Analytics.tsx`

### Fix 2: Double API Calls (Commit 70b5f881)
- **Issue:** `/api/classes/save-completed` called twice (1ms apart)
- **Evidence:** Render logs showed calls at 21:45:34.618 and 21:45:34.619
- **Root Cause:** "Accept & Add to Class" button had no debouncing
- **Solution:**
  - Added `isAccepting` state to track save operation
  - Button disabled during save: `disabled={isAccepting || isRegenerating}`
  - Early return prevents double-clicks: `if (isAccepting) return;`
  - Shows "Saving..." text during operation
- **File Modified:** `frontend/src/components/class-builder/ai-generation/GeneratedResults.tsx`

**Verification Results:**
- ✅ User confirmed: "When I accept a class, I see my stats page incremented by one only"
- ✅ Stats page shows accurate count immediately after class generation
- ✅ No duplicate API calls logged in Render
- ✅ Button prevents rapid successive clicks

**Historical Overcounting:**
- Historical data (15 classes_completed for 5 actual classes) was from previous bugs
- New classes now increment correctly (1× per class, not 3×)
- Existing users' historical data can be recalculated if needed

---

## Next Steps

1. ✅ **Fixed primary bug** (Frontend caching - stats not updating) - commit 0e7dc90d
2. ✅ **Fixed secondary bug** (Double API calls - overcounting) - commit 70b5f881
3. ✅ **Verified working** (User confirmed stats increment by 1 only)
4. ⏳ **Optional: Migration script** (recalculate historical `classes_completed` from `class_history` for existing users)

---

## Related Issues

- **Primary Bug:** Stats not updating after class generation (✅ FIXED - commit 0e7dc90d)
- **Secondary Bug:** classes_completed over-counting (✅ FIXED - commit 70b5f881)
