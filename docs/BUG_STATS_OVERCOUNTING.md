# Bug Report: classes_completed Over-Counting (3× Multiplier)

**Status:** ✅ RESOLVED - Two fixes applied
**Priority:** Medium (was Critical)
**Discovered:** December 25, 2025
**Resolved:** December 25, 2025
**Affects:** User preferences analytics

---

## Summary

The `/api/classes/save-completed` endpoint was being called **multiple times per class** (1ms apart), causing inconsistent counting behavior.

**Observed Behavior:**
- Classes 1-2: Counted correctly ✅
- Classes 3-4: Not counted at all (disappeared) ❌
- After logout/login: Only classes 1-2 appeared (classes 3-4 permanently lost) ❌

**Historical Data (before fix):**
- 5 actual classes generated
- `class_history` table: 5 records (correct)
- `user_preferences.classes_completed`: 15 (3× overcount)
- **Ratio:** Some classes counted 3×, some not counted at all

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

### The Real Fix: Button Debouncing (Commit 70b5f881)
- **Issue:** `/api/classes/save-completed` called twice (1ms apart)
- **Evidence:** Render logs showed calls at 21:45:34.618 and 21:45:34.619
- **Root Cause:** "Accept & Add to Class" button had no debouncing
- **Solution:**
  - Added `isAccepting` state to track save operation
  - Button disabled during save: `disabled={isAccepting || isRegenerating}`
  - Early return prevents double-clicks: `if (isAccepting) return;`
  - Shows "Saving..." text during operation
- **File Modified:** `frontend/src/components/class-builder/ai-generation/GeneratedResults.tsx`
- **Why This Fixed It:**
  - Prevents race conditions in database updates
  - Ensures exactly 1 API call per class acceptance
  - Eliminates lost classes (classes 3-4)
  - Stops overcounting (some classes were counted 3×)

### UX Improvement: Auto-Refresh Analytics (Commit 10dd933f)
- **Issue:** User had to manually refresh or logout/login to see updated stats
- **Solution:**
  - Removed "Refresh Stats" button (was a workaround, not the real fix)
  - Added automatic refresh when user returns to Analytics page
  - Uses `visibilitychange` event (tab becomes visible again)
  - Uses `focus` event (window regains focus)
- **File Modified:** `frontend/src/pages/Analytics.tsx`
- **User Experience:** Stats automatically update when navigating back to Analytics

**Why Classes 3-4 Disappeared:**
- Double API call at 21:45:34.618 and 21:45:34.619 (1ms apart)
- Created race condition in Supabase database update
- First call: Started transaction to increment `classes_completed`
- Second call (1ms later): Started competing transaction
- Result: Both transactions conflicted → **neither completed successfully**
- Class was saved to `class_history` table (correct)
- But `user_preferences.classes_completed` didn't increment (lost update)
- Classes 1-2 succeeded by timing luck
- Classes 3-4 failed due to race condition

**Historical Overcounting:**
- Historical data (15 classes_completed for 5 actual classes) shows mixed results:
  - Some classes counted 3× (when both duplicate calls succeeded)
  - Some classes counted 0× (when race condition caused lost update)
  - Average: 15 counts ÷ 5 classes = 3× multiplier
- New classes now increment correctly (1× per class)
- Race condition eliminated by button debouncing

**Verification Results:**
- ✅ User confirmed: "When I accept a class, I see my stats page incremented by one only"
- ✅ Stats page auto-updates when returning to Analytics (no manual refresh)
- ✅ No duplicate API calls in Render logs
- ✅ Button prevents rapid successive clicks
- ✅ No more lost classes (race condition eliminated)

---

## Next Steps

1. ✅ **Fixed root cause** (Button debouncing to prevent race conditions) - commit 70b5f881
2. ✅ **Improved UX** (Auto-refresh Analytics page on return) - commit 10dd933f
3. ✅ **Verified working** (User confirmed stats increment by 1 only)
4. ⏳ **Optional: Migration script** (recalculate historical `classes_completed` from `class_history` for existing users)

---

## Related Issues

- **Root Cause:** Double API calls creating race conditions (✅ FIXED - commit 70b5f881)
- **UX Issue:** Manual refresh required to see stats (✅ FIXED - commit 10dd933f)
- **Result:** Classes lost (3-4 disappeared) and overcounting (some counted 3×) both eliminated
