# Chromecast Integration Debug Log
**Issue:** Chromecast icon appears greyed out despite device being active
**Started:** January 10, 2026, 19:00 GMT
**Status:** IN PROGRESS

---

## Context

**User Environment:**
- Testing on iPhone (Safari)
- Chromecast device: Powered on, same WiFi network
- Can cast from other apps (Les Mills, YouTube) successfully
- Testing site: https://bassline-dev.netlify.app

**Expected Behavior:**
- Chromecast icon should appear in class playback (top right)
- Icon should be active (not greyed out) when Chromecast detected
- Clicking icon should open Cast device selection dialog

**Actual Behavior:**
- Icon appears but remains greyed out
- No console logs from CastButton component
- Cast SDK may not be initializing

---

## Attempts Made (Chronological)

### Attempt 1: Add Cast SDK to HTML + CSP Fix
**Time:** 19:05 GMT
**Commit:** ff24f749
**Changes:**
- Added Cast SDK script tag to `index.html`
- Added `https://www.gstatic.com` to CSP `script-src` directive in `public/_headers`
- Fixed audio cleanup (unrelated regression)

**Result:** ❌ FAILED
- User reported icon still greyed out
- Console logs showed CSP error (old cached version)

---

### Attempt 2: Fix X Button Visibility + Device Discovery
**Time:** 19:20 GMT
**Commits:** cd12daa9, 9bfc96a0
**Changes:**
- Made X button more visible (opacity 100% instead of 60%)
- Updated CastButton to listen for `CAST_STATE_CHANGED` events continuously
- Device availability now updates when devices are discovered (async)

**Result:** ❌ FAILED
- X button fix worked ✓
- Chromecast still greyed out
- Console logs still from production site (user confusion about which site)

---

### Attempt 3: Comprehensive Cast Logging
**Time:** 21:00 GMT
**Commit:** ac487050
**Changes:**
- Removed duplicate Cast SDK loading (was in both index.html and CastButton)
- Added detailed `[CastButton]` logging at every initialization step:
  - Component mount
  - SDK loaded check
  - Context creation
  - State changes
  - Error conditions
- Added 10-second timeout warning

**Expected Logs:**
```
[CastButton] Component mounted, waiting for Cast SDK...
[CastButton] Cast SDK already loaded, initializing immediately
[CastButton] Attempting to initialize Cast API...
[CastButton] Cast framework detected, creating context...
[CastButton] Cast context created successfully
[CastButton] Initial Cast state: [state]
[CastButton] 🎥 Google Cast initialized successfully
```

**Result:** ⏸️ PENDING VERIFICATION
- **Issue Found:** Netlify hasn't deployed this commit yet
- Live dev site serves `index-CmcG0--K.js`
- Latest build created `index-B-SOJSC8.js`
- **User's console shows ZERO `[CastButton]` logs** → component not initializing

---

## Root Cause Analysis

### Verified Working:
✅ Cast SDK script tag exists in live HTML (`curl` confirmed)
✅ CSP allows `https://www.gstatic.com` (`curl` confirmed)
✅ Cast SDK URL is accessible (HTTP 200)
✅ User's Chromecast is active (works with Les Mills, YouTube)
✅ User is testing correct site (bassline-dev.netlify.app via Web Inspector)

### Issues Found:
❌ **Netlify Auto-Deployment Not Working**
   - Commit ac487050 pushed to GitHub at 21:35 GMT
   - Dev site still serving old bundle (index-CmcG0--K.js) at 21:53 GMT
   - 18-minute delay suggests deployment failed or queued

❌ **CastButton Component Not Initializing**
   - Zero console logs with `[CastButton]` prefix
   - Suggests component either:
     1. Not rendering at all (removed from ClassPlayback?)
     2. Throwing error before first log
     3. Old bundle doesn't have CastButton

❌ **Possible Bundle/Build Issue**
   - Multiple commits may have created confusion
   - CastButton might be tree-shaken out
   - Import path issue preventing component load

---

## Current State (21:55 GMT)

**Git Status:**
- Latest commit: ac487050 (pushed to GitHub)
- Branch: dev
- Files modified: `src/components/CastButton.tsx`

**Netlify Status:**
- **UNKNOWN** - Need to check deployment dashboard
- Last successful deploy: Unknown
- Current bundle: `index-CmcG0--K.js` (not latest)

**User Console:**
- No `[CastButton]` logs visible
- Only video DEBUG logs showing
- Testing confirmed on dev site (Web Inspector title shows bassline-dev)

---

## Next Steps (Prioritized)

### 1. **Verify Netlify Deployment Status** (CRITICAL)
**Why:** Can't test fixes if they're not deployed
**Action:**
- Check Netlify dashboard for "bassline-dev" site
- Look at "Deploys" tab
- Confirm if deployment queued/building/failed
- Check build logs for errors

**If deployment failed:**
- Review build logs for error details
- Fix build error and redeploy
- May need to check `package.json` scripts

**If deployment succeeded but wrong bundle:**
- May be caching issue on Netlify CDN
- Try manual "Clear cache and deploy site" in dashboard

---

### 2. **Verify CastButton Import in ClassPlayback** (HIGH)
**Why:** Zero logs suggests component might not be imported/used
**Action:**
```bash
# Check if CastButton is imported in ClassPlayback
grep -n "CastButton" frontend/src/components/class-playback/ClassPlayback.tsx

# Check if it's rendered in JSX
grep -n "<CastButton" frontend/src/components/class-playback/ClassPlayback.tsx
```

**Expected:**
- Import statement near top of file
- `<CastButton onCastStateChange={...} />` in JSX around line 986

**If missing:**
- Component was accidentally removed
- Need to re-add import and JSX

---

### 3. **Test Cast SDK Loading Directly** (MEDIUM)
**Why:** Isolate if issue is SDK loading or component code
**Action:**
- In Web Inspector Console tab, run:
```javascript
// Check if Cast SDK loaded
console.log('Cast SDK:', window.cast ? 'LOADED' : 'NOT LOADED');

// Check if framework available
console.log('Cast framework:', window.cast?.framework ? 'AVAILABLE' : 'NOT AVAILABLE');

// Try to get context manually
if (window.cast?.framework) {
  try {
    const ctx = window.cast.framework.CastContext.getInstance();
    console.log('Cast context:', ctx);
    console.log('Cast state:', ctx.getCastState());
  } catch (e) {
    console.error('Cast context error:', e);
  }
}
```

**Expected Output (if SDK loaded correctly):**
```
Cast SDK: LOADED
Cast framework: AVAILABLE
Cast context: CastContext {...}
Cast state: NO_DEVICES_AVAILABLE (or NOT_CONNECTED if device found)
```

**If SDK not loaded:**
- CSP might still be blocking (check Network tab for failed request)
- Script tag malformed
- Safari blocking cross-origin scripts

---

### 4. **Check for JavaScript Errors** (MEDIUM)
**Why:** Silent errors might prevent component initialization
**Action:**
- In Console tab, filter to show only Errors (red)
- Look for errors mentioning:
  - "CastButton"
  - "Cannot read property"
  - "undefined is not an object"
  - Any errors in index-*.js around component mount time

**If errors found:**
- Fix the specific error
- May be TypeScript/build issue
- May be runtime dependency missing

---

### 5. **Verify Network Requests** (LOW)
**Why:** Confirm Cast SDK actually being requested
**Action:**
- In Web Inspector, click "Network" tab
- Filter by "JS" or search "gstatic"
- Look for: `cast_sender.js?loadCastFramework=1`

**Expected:**
- Request to gstatic.com
- Status: 200 OK
- Size: ~4KB

**If failed/blocked:**
- Check Status (if 403/404 = wrong URL, if blocked = CSP)
- Check Response Headers for CSP issues

---

## Key Files

**Frontend:**
- `frontend/src/components/CastButton.tsx` (Cast button component)
- `frontend/src/components/class-playback/ClassPlayback.tsx` (uses CastButton)
- `frontend/public/_headers` (CSP configuration)
- `frontend/index.html` (Cast SDK script tag)

**Commits:**
- ff24f749: CSP fix + audio cleanup
- cd12daa9: X button visibility
- 9bfc96a0: Device discovery updates
- ac487050: Comprehensive logging (NOT YET DEPLOYED)

---

## Decision Point

**Option A: Fix Deployment First**
- Pro: Can't test any code changes without working deployment
- Pro: Fixes root issue (deployments not working)
- Con: Might take time to debug Netlify config

**Option B: Test Manually in Console**
- Pro: Can immediately check if Cast SDK is loading
- Pro: Isolates if issue is SDK vs component code
- Con: Doesn't fix deployment issue

**Option C: Defer Chromecast Feature**
- Pro: Saves time, focuses on core functionality
- Pro: Can revisit when deployment pipeline stable
- Con: Feature remains incomplete

**User's Choice:** Revisit Chromecast (continue debugging)

---

## Questions for User

1. **Netlify Dashboard Check:**
   - Can you open https://app.netlify.com/sites/bassline-dev/deploys
   - What's the status of the most recent deploy?
   - When was last successful deploy timestamp?

2. **Console Test:**
   - In Web Inspector Console tab, can you paste and run the Cast SDK test commands (from Step 3 above)?
   - What output do you see?

3. **Network Tab:**
   - In Network tab, do you see `cast_sender.js` being requested?
   - What's its status (200, 403, blocked)?

---

## Success Criteria

✅ **Phase 1: Component Renders**
- Console shows `[CastButton] Component mounted, waiting for Cast SDK...`
- Means component is imported and executing

✅ **Phase 2: SDK Loads**
- Console shows `[CastButton] Cast SDK already loaded, initializing immediately`
- OR `[CastButton] __onGCastApiAvailable callback fired: true`
- Means Cast SDK script loaded successfully

✅ **Phase 3: Context Created**
- Console shows `[CastButton] 🎥 Google Cast initialized successfully`
- Means Cast API initialized without errors

✅ **Phase 4: Device Detected**
- Console shows `[CastButton] 📡 Chromecast device(s) available`
- Icon changes from greyed out to active
- Means device discovery working

✅ **Phase 5: Connection Works**
- Clicking icon opens Cast device selection dialog
- Shows user's Chromecast device
- Can connect and cast audio

---

## Lessons Learned

1. **Always verify deployment status before assuming code is live**
   - Git push ≠ deployed code
   - Check actual bundle filename in HTML vs build output
   - Wait for Netlify build confirmation

2. **Console logs are only useful if code is actually running**
   - Zero logs = component not executing
   - Could be: not imported, build issue, or error before first log

3. **User testing workflow matters**
   - Clear cache instructions must be precise
   - Multiple tabs can cause confusion
   - Screenshots help verify actual state

4. **Deployment pipeline needs to be reliable for iterative debugging**
   - Can't debug frontend issues without seeing changes
   - Need faster feedback loop (auto-deploy or manual trigger)

---

## Next Session Priorities

1. ✅ Check Netlify deployment status
2. ✅ Get latest code actually deployed
3. ✅ Run Cast SDK manual test in console
4. ✅ Review console for `[CastButton]` logs
5. ✅ Fix any initialization errors found

**Last Updated:** January 10, 2026, 22:00 GMT
