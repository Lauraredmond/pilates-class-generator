# Chromecast CSP Fix - Testing Instructions

## Bug Fix Applied (Commit d3391bbd)

**Problem Identified:** CSP was blocking Google Cast SDK from connecting to Google's servers for device discovery.

**Root Cause:**
- Cast SDK loaded successfully (script-src allowed `https://www.gstatic.com`)
- BUT Cast SDK couldn't discover devices (connect-src was MISSING Google domains)
- Device discovery requires network connections to `*.google.com`, `*.googleapis.com`, `*.gstatic.com`, `*.googleusercontent.com`

**Fix Applied:**
Added Google Cast domains to CSP `connect-src` directive in `frontend/public/_headers`

---

## How to Test the Fix

### Prerequisites
1. ✅ Chromecast device powered on
2. ✅ iPhone and Chromecast on same WiFi network
3. ✅ Safari cache cleared

### Testing Steps

**Step 1: Clear Safari Cache (CRITICAL)**
```
iPhone Settings → Safari → Clear History and Website Data → Clear
```

**Why:** Old cached CSP headers will prevent fix from working

---

**Step 2: Open Dev Site**
```
Navigate to: https://bassline-dev.netlify.app
```

**NOT production** (`basslinemvp.netlify.app`) - fix only deployed to dev

---

**Step 3: Login and Start Playback**
1. Login with your credentials
2. Navigate to class builder
3. Generate a class (database mode is fastest)
4. Accept generated class
5. Click "Play Class"

---

**Step 4: Check Cast Button State**

**BEFORE FIX (Screenshot 13:35:15):**
- Cast icon: GREYED OUT ❌
- Disabled/not clickable
- Title: "No Cast devices found"

**AFTER FIX (Expected):**
- Cast icon: WHITE/CREAM ✅
- Enabled/clickable (matches Les Mills screenshot 13:31:47)
- Title: "Cast to TV"

---

**Step 5: Test Cast Menu**

1. **Tap the Cast button** (should be white/clickable)
2. **Expected:** Device selection dialog appears
3. **Expected:** Your Chromecast device is listed (e.g., "Living Room TV")
4. **Screenshot:** Take photo of device selection menu

---

**Step 6: Test Connection (Optional)**

1. **Tap your Chromecast** in device list
2. **Expected:** Connection initiates
3. **Expected:** TV shows class content
4. **Expected:** iPhone shows remote control interface
5. **Test:** Play/pause works, skip works, audio on TV

---

## Diagnostic Information to Collect

### If Cast Icon Still Greyed Out ❌

**Run these commands in Web Inspector Console:**

1. Connect iPhone to Mac with USB
2. Mac Safari → Develop → [Your iPhone] → [bassline-dev tab]
3. Console tab → paste these commands:

```javascript
// Check Cast SDK loaded
console.log('Cast SDK:', typeof window.cast);
console.log('Cast framework:', typeof window.cast?.framework);

// Check for CSP errors
// Look for red errors mentioning "Content Security Policy"
// or "Refused to connect"

// Get Cast state
if (window.cast?.framework) {
  try {
    const ctx = window.cast.framework.CastContext.getInstance();
    console.log('Cast state:', ctx.getCastState());
  } catch (e) {
    console.error('Cast error:', e);
  }
}
```

**Expected Output if Working:**
```
Cast SDK: "object"
Cast framework: "object"
Cast state: "NOT_CONNECTED"  (device available but not connected)
```

**If Broken:**
```
Cast SDK: "undefined" → SDK not loading
Cast state: "NO_DEVICES_AVAILABLE" → Still can't discover devices
```

---

### If CSP Still Blocking

**Look for Console Errors:**
```
❌ Refused to connect to 'https://XXX.google.com' because it violates CSP connect-src directive
❌ Refused to connect to 'https://XXX.googleapis.com' because it violates CSP connect-src directive
```

**If you see these:**
- CSP headers didn't update (caching issue)
- Try hard refresh: Settings → Safari → Advanced → Website Data → Remove All
- Or wait 10 minutes for Netlify CDN cache to expire

---

## Success Criteria

**Test PASSES if:**
- ✅ Cast icon is WHITE/ENABLED (not greyed out)
- ✅ Clicking icon opens device selection menu
- ✅ Chromecast device appears in list
- ✅ No CSP errors in console

**Test is COMPLETE if:**
- ✅ All above PLUS connection succeeds
- ✅ TV shows class content
- ✅ Controls work from phone

---

## What to Report Back

**Please provide:**

1. **Cast Button State:**
   - Screenshot of playback screen showing Cast button
   - State: White/enabled OR greyed out/disabled?

2. **Console Logs:**
   - All logs containing `[CastButton]`
   - Any CSP errors (red text)
   - Output from diagnostic commands above

3. **Device Selection Menu:**
   - Did menu appear? (yes/no)
   - Screenshot of menu if it appeared
   - Was Chromecast listed? (yes/no)

4. **Connection Test:**
   - Did connection succeed? (yes/no)
   - Did TV show content? (yes/no)
   - Did controls work? (yes/no)

---

## Troubleshooting

### Issue: Cast Icon Still Greyed Out After Cache Clear

**Possible Causes:**
1. CSP headers still cached (wait 10 min, try again)
2. Different CSP issue (check console for specific errors)
3. Chromecast not on same WiFi network
4. Chromecast in "Guest Mode Only" setting

**Solutions:**
- Hard refresh: Clear all website data (not just history)
- Check Chromecast settings (should allow local network discovery)
- Verify WiFi network (not guest network, same as Chromecast)

---

### Issue: Menu Appears But No Devices Listed

**Causes:**
- Chromecast powered off
- Different WiFi networks
- Firewall blocking local network discovery

**Solutions:**
- Verify Chromecast is on (should show idle screen on TV)
- Verify both devices on same network
- Disable VPN if active

---

## Next Steps

**If Fix Works:**
- 🎉 Problem solved! Chromecast device discovery fixed
- Ready to merge to production
- Can proceed with additional Cast features (playback control, queue management)

**If Fix Doesn't Work:**
- Share console logs and screenshots
- May need additional CSP domains
- May need different Cast SDK initialization approach

---

**Last Updated:** January 16, 2026 13:50 GMT
**Fix Commit:** d3391bbd
**Testing Environment:** https://bassline-dev.netlify.app
