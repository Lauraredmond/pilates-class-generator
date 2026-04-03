# Video Troubleshooting Checklist - Preparation & Warmup Sections

**Issue:** Generic placeholder video not appearing for preparation and warmup sections
**Date:** December 15, 2025

---

## Step 1: Verify Database Migration Run

**Check if video_url columns exist:**

```sql
-- Check preparation_scripts table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'preparation_scripts'
AND column_name = 'video_url';

-- Check warmup_routines table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'warmup_routines'
AND column_name = 'video_url';
```

**Expected Output:**
```
column_name | data_type | is_nullable
------------|-----------|-------------
video_url   | text      | YES
```

**If columns don't exist:**
- ❌ Migration 033 was NOT run
- ✅ **FIX:** Run `database/migrations/033_add_video_url_to_all_sections.sql` in Supabase SQL Editor

---

## Step 2: Verify URLs in Database

**Check if video URLs are set:**

```sql
-- Check preparation_scripts
SELECT id, script_name, video_url
FROM preparation_scripts;

-- Check warmup_routines
SELECT id, routine_name, video_url
FROM warmup_routines;
```

**Expected Output:**
```
script_name: "Core Connection & Breath" (or similar)
video_url: "https://d1chkg8zq1g5j8.cloudfront.net/Generic_Placeholder.mp4"

routine_name: "Full Body Activation" (or similar)
video_url: "https://d1chkg8zq1g5j8.cloudfront.net/Generic_Placeholder.mp4"
```

**If video_url is NULL:**
- ❌ UPDATE statements were NOT run
- ✅ **FIX:** Run the UPDATE statements I provided earlier

---

## Step 3: Verify Backend Returns video_url

**Test backend API directly:**

Open browser console and run:

```javascript
// Test preparation endpoint
fetch('https://pilates-class-generator-api3.onrender.com/api/class-sections/preparation', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
  }
})
.then(r => r.json())
.then(data => {
  console.log('Preparation API response:', data);
  console.log('First record video_url:', data[0]?.video_url);
});

// Test warmup endpoint
fetch('https://pilates-class-generator-api3.onrender.com/api/class-sections/warmup', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
  }
})
.then(r => r.json())
.then(data => {
  console.log('Warmup API response:', data);
  console.log('First record video_url:', data[0]?.video_url);
});
```

**How to get JWT token:**
1. Open browser DevTools (F12)
2. Go to Application tab → Local Storage → https://basslinemvp.netlify.app
3. Find key: `pilates_auth_token`
4. Copy the value (long string starting with `eyJ...`)

**Expected Output:**
```javascript
Preparation API response: [{
  id: "...",
  script_name: "Core Connection & Breath",
  narrative: "...",
  video_url: "https://d1chkg8zq1g5j8.cloudfront.net/Generic_Placeholder.mp4",
  // ... other fields
}]
First record video_url: "https://d1chkg8zq1g5j8.cloudfront.net/Generic_Placeholder.mp4"
```

**If video_url is missing from API response:**
- ❌ Backend Pydantic models don't include video_url
- ✅ **FIX:** Verify `backend/api/class_sections.py` has `video_url: Optional[str] = None` in PreparationScript and WarmupRoutine models (lines 44 and 62)
- ✅ Restart Render backend service to pick up code changes

---

## Step 4: Verify Frontend Receives video_url

**Add temporary debug logging:**

Open browser console during class generation and look for:

```
🎥 DEBUG: Preparation section data:
🎥 DEBUG: Warmup section data:
```

**If you DON'T see these logs:**
- ❌ Frontend isn't logging the section data
- ✅ **FIX:** We need to add debug logging to AIGenerationPanel.tsx

**Quick debug test - Run in browser console after generating a class:**

```javascript
// Inspect the results object
console.log('Full results object:', window.lastResults);
console.log('Preparation video_url:', window.lastResults?.completeClass?.preparation?.video_url);
console.log('Warmup video_url:', window.lastResults?.completeClass?.warmup?.video_url);
```

---

## Step 5: Verify Video Rendering Logic

**Check MovementDisplay component:**

The key question: Does MovementDisplay receive the video_url for preparation/warmup sections?

**Add these console.log statements temporarily:**

In `frontend/src/components/class-playback/MovementDisplay.tsx`, add at line 96:

```typescript
if (item.type === 'preparation') {
  console.log('🎥 PREP DEBUG: Preparation item:', item);
  console.log('🎥 PREP DEBUG: video_url:', item.video_url);
  const buildPreparationNarrative = () => {
    // ... existing code
  };
  return renderTeleprompter(buildPreparationNarrative(), item.video_url);
}
```

And at line 113:

```typescript
if (item.type === 'warmup') {
  console.log('🎥 WARMUP DEBUG: Warmup item:', item);
  console.log('🎥 WARMUP DEBUG: video_url:', item.video_url);
  const buildWarmupNarrative = () => {
    // ... existing code
  };
  return renderTeleprompter(buildWarmupNarrative(), item.video_url);
}
```

**Expected console output when preparation section plays:**
```
🎥 PREP DEBUG: Preparation item: {type: "preparation", script_name: "...", video_url: "https://..."}
🎥 PREP DEBUG: video_url: "https://d1chkg8zq1g5j8.cloudfront.net/Generic_Placeholder.mp4"
```

**If video_url is undefined:**
- ❌ AIGenerationPanel.tsx isn't mapping video_url from backend to PlaybackItem
- ✅ **FIX:** Check line 277 (preparation) and line 292 (warmup) in AIGenerationPanel.tsx

---

## Step 6: Compare with Working "The Hundred" Video

**What we know works from Console.txt:**

```
✅ The Hundred video_url is set in database
✅ Backend returns video_url in API response
✅ Frontend receives video_url in PlaybackItem
✅ Video element is created with correct src
✅ Video loads successfully (onLoadedData fires)
✅ Video plays in picture-in-picture
```

**What might be different for preparation/warmup:**

1. **Different API endpoints:**
   - Movements: `/api/movements` ✅ Working
   - Preparation: `/api/class-sections/preparation` ❓ Unknown
   - Warmup: `/api/class-sections/warmup` ❓ Unknown

2. **Different data flow:**
   - Movements: Fetched during class generation
   - Preparation/Warmup: Fetched during class generation
   - BUT: Are they being fetched at all?

3. **Different backend functions:**
   - Movements: `get_movements()` endpoint
   - Preparation/Warmup: `get_preparation_scripts()` and `get_warmup_routines()` endpoints
   - Check if these endpoints are even being called

---

## Most Likely Culprits

Based on the console logs showing zero attempts to load preparation/warmup videos:

### **#1: Database Migration Not Run (80% probability)**

**Symptoms:**
- No error messages (because video_url column doesn't exist, query silently ignores it)
- Backend doesn't crash (because Pydantic model has Optional[str] = None)
- Frontend receives null/undefined for video_url

**Fix:**
```sql
-- Run in Supabase SQL Editor
-- File: database/migrations/033_add_video_url_to_all_sections.sql

ALTER TABLE preparation_scripts ADD COLUMN video_url TEXT;
ALTER TABLE warmup_routines ADD COLUMN video_url TEXT;

-- Then run UPDATE statements
UPDATE preparation_scripts
SET video_url = 'https://d1chkg8zq1g5j8.cloudfront.net/Generic_Placeholder.mp4';

UPDATE warmup_routines
SET video_url = 'https://d1chkg8zq1g5j8.cloudfront.net/Generic_Placeholder.mp4';
```

---

### **#2: Backend Not Redeployed After Code Changes (15% probability)**

**Symptoms:**
- Code changes made to class_sections.py
- But Render is still running old version without video_url field

**Fix:**
- Go to Render dashboard
- Find `pilates-class-generator-api3` service
- Click "Manual Deploy" → "Deploy latest commit"
- Wait for deployment to complete (~2 minutes)

---

### **#3: Frontend Cache Issue (5% probability)**

**Symptoms:**
- Frontend is running old version without video_url handling

**Fix:**
- Hard refresh browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
- Or clear browser cache
- Or open in incognito window

---

## Quick Diagnostic Script

**Run this in browser console to check everything at once:**

```javascript
async function diagnoseVideoIssue() {
  console.log('=== VIDEO DIAGNOSTIC TOOL ===\n');

  // 1. Check if JWT token exists
  const token = localStorage.getItem('pilates_auth_token');
  if (!token) {
    console.error('❌ No JWT token found - please login first');
    return;
  }
  console.log('✅ JWT token found');

  // 2. Test preparation endpoint
  console.log('\n--- Testing Preparation Endpoint ---');
  try {
    const prepRes = await fetch('https://pilates-class-generator-api3.onrender.com/api/class-sections/preparation', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const prepData = await prepRes.json();
    console.log('Response status:', prepRes.status);
    console.log('Response data:', prepData);

    if (prepData.length > 0) {
      console.log('video_url in response:', prepData[0].video_url);
      if (prepData[0].video_url) {
        console.log('✅ Preparation video_url is set:', prepData[0].video_url);
      } else {
        console.error('❌ Preparation video_url is NULL/undefined');
        console.error('   → Run migration 033 and UPDATE statement');
      }
    }
  } catch (err) {
    console.error('❌ Preparation endpoint failed:', err);
  }

  // 3. Test warmup endpoint
  console.log('\n--- Testing Warmup Endpoint ---');
  try {
    const warmupRes = await fetch('https://pilates-class-generator-api3.onrender.com/api/class-sections/warmup', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const warmupData = await warmupRes.json();
    console.log('Response status:', warmupRes.status);
    console.log('Response data:', warmupData);

    if (warmupData.length > 0) {
      console.log('video_url in response:', warmupData[0].video_url);
      if (warmupData[0].video_url) {
        console.log('✅ Warmup video_url is set:', warmupData[0].video_url);
      } else {
        console.error('❌ Warmup video_url is NULL/undefined');
        console.error('   → Run migration 033 and UPDATE statement');
      }
    }
  } catch (err) {
    console.error('❌ Warmup endpoint failed:', err);
  }

  console.log('\n=== DIAGNOSTIC COMPLETE ===');
}

// Run the diagnostic
diagnoseVideoIssue();
```

---

## Summary: Action Items in Order

1. ✅ **Run diagnostic script above** to identify exact failure point
2. ✅ **Run migration 033** if video_url columns don't exist
3. ✅ **Run UPDATE statements** if video_url values are NULL
4. ✅ **Redeploy Render backend** if code changes aren't live
5. ✅ **Hard refresh frontend** if using cached version
6. ✅ **Add debug logging** if still not working (see Step 5)
7. ✅ **Test in incognito window** to rule out cache issues

---

**Most likely fix:** Run the migration + UPDATE statements in Supabase SQL Editor. I'm betting the database columns don't exist yet or the URLs aren't set.
