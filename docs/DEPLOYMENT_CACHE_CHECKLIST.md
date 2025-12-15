# Deployment & Cache Diagnostic Checklist

**Issue:** Database has video URLs, but videos not appearing in frontend
**Root Cause:** Code changes not deployed yet OR browser cache showing old version

---

## Step 1: Check Netlify Frontend Deployment

**Go to:** https://app.netlify.com/sites/basslinemvp/deploys

**Look for:**
- Latest deploy should show commit `18c58ba` (or later)
- Status should be "Published" (green checkmark)
- Deploy time should be within last 15 minutes

**If deployment is in progress:**
- Wait 2-3 minutes for build to complete
- Netlify auto-deploys on every GitHub push

**If latest commit is NOT deployed:**
- Click "Trigger deploy" → "Deploy site"
- Wait for build to finish

---

## Step 2: Check Render Backend Deployment

**Go to:** https://dashboard.render.com/web/srv-ctbnkqpu0jms738tcch0

**Look for:**
- Latest deploy should show commit `18c58ba` (or later)
- Status should be "Live" (green dot)
- Deploy time should be within last 15 minutes

**If deployment is in progress:**
- Wait 2-3 minutes for build to complete
- Render auto-deploys on every GitHub push

**If latest commit is NOT deployed:**
- Click "Manual Deploy" → "Deploy latest commit"
- Wait for build to finish

---

## Step 3: Clear Browser Cache

**Hard Refresh (Clears cached JavaScript/CSS):**
- **Mac:** `Cmd + Shift + R`
- **Windows:** `Ctrl + Shift + R`

**OR use Incognito/Private window:**
- **Mac:** `Cmd + Shift + N` (Chrome) or `Cmd + Shift + P` (Safari)
- **Windows:** `Ctrl + Shift + N` (Chrome/Edge)

**Why this matters:**
- Your browser caches the old JavaScript bundle
- Even if Netlify deployed new code, browser shows old version
- Hard refresh forces download of latest code

---

## Step 4: Test Backend API Directly

**Open browser console (F12) and run:**

```javascript
// Get your JWT token
const token = localStorage.getItem('pilates_auth_token');

// Test preparation endpoint
fetch('https://pilates-class-generator-api3.onrender.com/api/class-sections/preparation', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => {
  console.log('=== PREPARATION API TEST ===');
  console.log('Full response:', data);
  console.log('video_url field:', data[0]?.video_url);

  if (data[0]?.video_url) {
    console.log('✅ Backend IS returning video_url:', data[0].video_url);
  } else {
    console.error('❌ Backend NOT returning video_url');
    console.error('→ Render backend needs redeployment');
  }
});

// Test warmup endpoint
fetch('https://pilates-class-generator-api3.onrender.com/api/class-sections/warmup', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => {
  console.log('=== WARMUP API TEST ===');
  console.log('Full response:', data);
  console.log('video_url field:', data[0]?.video_url);

  if (data[0]?.video_url) {
    console.log('✅ Backend IS returning video_url:', data[0].video_url);
  } else {
    console.error('❌ Backend NOT returning video_url');
    console.error('→ Render backend needs redeployment');
  }
});
```

**Expected Output:**
```
✅ Backend IS returning video_url: https://d1chkg8zq1g5j8.cloudfront.net/Generic_Placeholder.mp4
```

**If backend NOT returning video_url:**
- Render hasn't deployed latest code yet
- Wait for auto-deploy to finish
- Or trigger manual deploy in Render dashboard

---

## Step 5: Verify Frontend Receives Data

**After generating a new class, check console for:**

```javascript
// Look for these logs in console:
🎥 PREP DEBUG: Preparation item: {type: "preparation", video_url: "https://..."}
🎥 WARMUP DEBUG: Warmup item: {type: "warmup", video_url: "https://..."}
```

**If you DON'T see these logs:**
- Frontend hasn't been updated with new debug code
- Hard refresh browser (Cmd+Shift+R)
- Or wait for Netlify deployment to complete

**If logs show `video_url: undefined`:**
- Backend not returning the field
- Check Step 4 (backend API test)

---

## Step 6: Check Code Was Actually Deployed

**Verify latest commit on GitHub:**

1. Go to: https://github.com/Lauraredmond/pilates-class-generator/commits/main
2. Latest commit should be `18c58ba` or later
3. Commit message: "feat: Add video infrastructure to all 6 class section types"

**Check what Netlify deployed:**

1. Go to Netlify deploy log
2. Look for line: "Deploying commit: 18c58ba"
3. If older commit shown, deployment hasn't happened yet

**Check what Render deployed:**

1. Go to Render deploy log
2. Look for line: "Deploying commit: 18c58ba"
3. If older commit shown, deployment hasn't happened yet

---

## Common Timing Issues

**Scenario: Just pushed code to GitHub**

```
Time 0:00 - Code pushed to GitHub ✅
Time 0:30 - Netlify starts auto-deploy 🔄
Time 0:30 - Render starts auto-deploy 🔄
Time 3:00 - Netlify deploy completes ✅
Time 3:30 - Render deploy completes ✅
Time 3:35 - User hard-refreshes browser ✅
Time 3:35 - VIDEOS WORK! 🎉
```

**If you test too early:**
- Deployments still in progress
- Old code is running
- Videos won't appear yet

**Solution:** Wait 5 minutes after push, then hard refresh

---

## Quick Diagnostic Script

**Run this to check everything:**

```javascript
async function fullDiagnostic() {
  console.log('=== FULL DIAGNOSTIC ===\n');

  // 1. Check if logged in
  const token = localStorage.getItem('pilates_auth_token');
  if (!token) {
    console.error('❌ Not logged in - login first');
    return;
  }
  console.log('✅ JWT token found\n');

  // 2. Test preparation endpoint
  console.log('--- Testing Preparation Endpoint ---');
  try {
    const prepRes = await fetch('https://pilates-class-generator-api3.onrender.com/api/class-sections/preparation', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const prepData = await prepRes.json();

    if (prepData[0]?.video_url) {
      console.log('✅ Preparation video_url:', prepData[0].video_url);
    } else {
      console.error('❌ Preparation video_url is missing');
      console.error('   Fields returned:', Object.keys(prepData[0] || {}));
      console.error('   → Backend NOT deployed yet or missing field');
    }
  } catch (err) {
    console.error('❌ Preparation endpoint failed:', err.message);
  }

  // 3. Test warmup endpoint
  console.log('\n--- Testing Warmup Endpoint ---');
  try {
    const warmupRes = await fetch('https://pilates-class-generator-api3.onrender.com/api/class-sections/warmup', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const warmupData = await warmupRes.json();

    if (warmupData[0]?.video_url) {
      console.log('✅ Warmup video_url:', warmupData[0].video_url);
    } else {
      console.error('❌ Warmup video_url is missing');
      console.error('   Fields returned:', Object.keys(warmupData[0] || {}));
      console.error('   → Backend NOT deployed yet or missing field');
    }
  } catch (err) {
    console.error('❌ Warmup endpoint failed:', err.message);
  }

  // 4. Check frontend version
  console.log('\n--- Frontend Version Check ---');
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const viteBundle = scripts.find(s => s.src.includes('/assets/index-'));
  if (viteBundle) {
    console.log('Frontend bundle:', viteBundle.src);
    console.log('If this hasn\'t changed after refresh, clear cache harder');
  }

  console.log('\n=== DIAGNOSTIC COMPLETE ===');
  console.log('\nNext steps:');
  console.log('1. If video_url missing → Wait for Render deployment');
  console.log('2. If video_url present → Hard refresh browser (Cmd+Shift+R)');
  console.log('3. Generate NEW class to test (old classes won\'t have videos)');
}

fullDiagnostic();
```

---

## Summary: Most Likely Issues

### Issue #1: Render Backend Not Deployed Yet (60% probability)

**Symptoms:**
- Backend API doesn't return video_url field
- Database has the URLs (confirmed in your screenshot)
- Code was committed to GitHub

**Fix:**
- Wait 3-5 minutes for Render auto-deploy
- OR manually trigger deploy in Render dashboard
- Test backend API with script in Step 4

---

### Issue #2: Netlify Frontend Not Deployed Yet (30% probability)

**Symptoms:**
- Backend returns video_url correctly
- But frontend doesn't create video elements
- Console shows old JavaScript bundle

**Fix:**
- Wait 2-3 minutes for Netlify auto-deploy
- OR manually trigger deploy in Netlify dashboard
- Hard refresh browser (Cmd+Shift+R)

---

### Issue #3: Browser Cache (10% probability)

**Symptoms:**
- Both deployments complete
- But still not working

**Fix:**
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- OR open incognito/private window
- OR clear browser cache completely

---

## Final Checklist

Before concluding videos are broken:

- [ ] Database has video URLs (✅ CONFIRMED in your screenshot)
- [ ] Netlify deployment complete (commit 18c58ba or later)
- [ ] Render deployment complete (commit 18c58ba or later)
- [ ] Browser cache cleared (hard refresh)
- [ ] Backend API returns video_url field (test with script)
- [ ] Generated NEW class (old classes don't have video infrastructure)
- [ ] Opened browser console to check for errors
- [ ] Waited at least 5 minutes after code push

**If all checked and still not working:** Run the fullDiagnostic() script and share the console output.
