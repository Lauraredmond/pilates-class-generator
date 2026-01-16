# Chromecast Manual Testing Guide

**Purpose:** Test Chromecast integration on real devices where Google Cast SDK can properly initialize

**Requirements:**
- iPhone or iPad with Safari browser
- Chromecast device or Google TV
- Both devices on same WiFi network
- Chromecast powered on and ready

---

## Pre-Test Setup

### 1. Prepare Chromecast Device
- ✅ Power on your Chromecast/Google TV
- ✅ Verify it's connected to WiFi
- ✅ Note the device name (e.g., "Living Room TV")
- ✅ Ensure it's on the SAME WiFi network as your iPhone

### 2. Prepare iPhone/iPad
- ✅ Open Settings → Safari → Advanced → Web Inspector: **ENABLE**
- ✅ Connect to SAME WiFi network as Chromecast
- ✅ Close all Safari tabs
- ✅ Clear Safari cache: Settings → Safari → Clear History and Website Data

### 3. Optional: Connect Mac for Console Logs
- ✅ Connect iPhone to Mac with USB cable
- ✅ Open Safari on Mac
- ✅ Safari menu → Develop → [Your iPhone] → [Your Tab]
- ✅ Web Inspector will show console logs

---

##  Step-by-Step Test Procedure

### Step 1: Navigate to Class Playback
1. Open Safari on iPhone
2. Go to `https://bassline-dev.netlify.app` **(DEV environment - Chromecast not in production yet)**
3. Login with your credentials
4. Navigate to class builder
5. Generate a class (use database mode for speed)
6. Accept the generated class
7. Click "Play Class" to start playback

**Expected:** ClassPlayback component renders with fullscreen class interface

**Screenshot Required:** Take screenshot of playback screen

---

### Step 2: Locate Chromecast Button
Look for the Cast button in the playback interface:
- **Location:** Top-right corner of screen
- **Icon:** Cast/TV icon (rectangle with WiFi waves)
- **Color:**
  - White/cream if Chromecast devices found
  - Greyed out (cream/30% opacity) if no devices

**Expected [CastButton] Console Logs:**
```
[CastButton] Component mounted
[CastButton] Cast SDK initialization started
[CastButton] Cast SDK loaded successfully
[CastButton] Cast state changed: NO_DEVICES_AVAILABLE
```
OR
```
[CastButton] Cast state changed: NOT_CONNECTED (Devices available!)
```

**Action:** Take screenshot showing Cast button location

---

### Step 3: Check Button State (Console Logs Required)

**If using Mac + Web Inspector:**

Open Web Inspector and filter console for `[CastButton]` logs:

1. Check for initialization logs:
   - ✅ "Component mounted"
   - ✅ "Cast SDK initialization started"
   - ✅ "Cast SDK loaded successfully"

2. Check Cast state:
   - ❌ `NO_DEVICES_AVAILABLE` = Chromecast not detected (troubleshoot)
   - ✅ `NOT_CONNECTED` = Chromecast detected and ready!

3. Check for errors:
   - ❌ "Cast SDK failed to load" = CSP or network issue
   - ❌ "window.cast is undefined" = SDK didn't inject properly

**Without Mac (Visual Inspection):**

- **Button greyed out** = No Chromecast detected
- **Button white/clickable** = Chromecast detected!

**Action:** Copy ALL console logs containing `[CastButton]` or `cast` and save to file

---

### Step 4: Test Cast Menu (If Button Enabled)

**If Cast button is WHITE/CLICKABLE:**

1. Tap the Cast button
2. **Expected:** Cast device selection menu appears
3. **Expected:** Your Chromecast device is listed (e.g., "Living Room TV")
4. Take screenshot of device selection menu

**If menu appears:**
5. Tap your Chromecast device name
6. **Expected:** Connection initiates
7. **Expected Console Logs:**
   ```
   [CastButton] Cast state changed: CONNECTING
   [CastButton] Cast state changed: CONNECTED
   [CastButton] Connected to: Living Room TV
   ```

8. **Expected:**
   - TV shows class content
   - iPhone shows remote control interface
   - Audio plays on TV speakers
   - Phone controls play/pause/skip

**Action:** Take screenshots of:
- Device selection menu
- Connected state on phone
- TV screen showing class content

---

### Step 5: Test Playback Controls (If Connected)

**While connected to Chromecast:**

1. **Test Play/Pause:**
   - Tap play/pause button on phone
   - **Expected:** TV playback pauses/resumes
   - **Expected:** Button states sync

2. **Test Skip:**
   - Tap next section button
   - **Expected:** TV advances to next section
   - **Expected:** Timer updates on phone

3. **Test Volume:**
   - Use phone or TV remote volume controls
   - **Expected:** Audio adjusts on TV

4. **Test Disconnect:**
   - Tap Cast button again
   - Select "Stop Casting"
   - **Expected:** Playback returns to phone
   - **Expected Console Log:** `[CastButton] Cast state changed: NOT_CONNECTED`

**Action:** Document any issues with controls

---

## Troubleshooting Guide

### Issue 1: Cast Button Greyed Out

**Symptoms:**
- Cast button visible but not clickable
- Console shows: `NO_DEVICES_AVAILABLE`

**Solutions:**
1. Verify iPhone and Chromecast on same WiFi (not guest network)
2. Power cycle Chromecast (unplug 10 seconds)
3. Restart iPhone WiFi: Settings → WiFi → Off → On
4. Check Chromecast is not in "Guest Mode Only"
5. Try opening YouTube app - does it detect Chromecast?

---

### Issue 2: Cast Button Not Visible

**Symptoms:**
- No Cast button appears at all
- Console shows errors loading SDK

**Solutions:**
1. Check console for CSP errors:
   - Error: "Refused to load script from gstatic.com"
   - **Fix:** CSP needs updating (report to developers)

2. Check network:
   - Error: "Failed to load cast_sender.js"
   - **Fix:** Try different WiFi or disable VPN

3. Check Safari version:
   - Cast SDK requires iOS 13+ and modern Safari
   - **Fix:** Update iOS

---

### Issue 3: Cast Menu Doesn't Open

**Symptoms:**
- Cast button enabled (white) but clicking does nothing
- No console errors

**Solutions:**
1. Try long-press instead of tap
2. Check for modal/overlay blocking touch
3. Check console for JavaScript errors

---

### Issue 4: Connection Fails

**Symptoms:**
- Device appears in menu
- Tap device but connection fails
- Console shows: `CONNECTING` but never `CONNECTED`

**Solutions:**
1. Check Chromecast is not already casting from another device
2. Power cycle Chromecast
3. Check firewall isn't blocking ports 8008-8009
4. Try factory reset Chromecast (last resort)

---

## Data Collection for Developers

**Please provide the following:**

### 1. Console Logs (CRITICAL)
Copy ALL console messages from Web Inspector, especially:
- Lines containing `[CastButton]`
- Lines containing `cast`
- Any errors (red text)
- Any warnings (yellow text)

**How to collect:**
1. Mac Safari → Develop → [Your iPhone] → Web Inspector
2. Console tab → Filter for "cast"
3. Right-click console → Save Console
4. Send saved file

### 2. Screenshots
- Screenshot of playback screen showing Cast button location
- Screenshot of Cast button close-up (zoomed in)
- Screenshot of device selection menu (if appears)
- Screenshot of connected state (if successful)

### 3. Network Information
- Your WiFi network name (hide password)
- Chromecast device model (e.g., Chromecast 3rd gen, Google TV)
- iPhone model and iOS version
- Safari version

### 4. Environment
- Testing URL: **DEV ONLY** (`bassline-dev.netlify.app`) - Chromecast not deployed to production yet
- Date and time of test
- Any VPN or proxy active?

---

## Success Criteria

**Test is SUCCESSFUL if:**
- ✅ Cast button appears in playback interface
- ✅ Cast button shows correct state (enabled if Chromecast found)
- ✅ Console logs show `[CastButton]` initialization
- ✅ Console logs show Cast SDK loaded
- ✅ Cast state updates correctly (NO_DEVICES_AVAILABLE or NOT_CONNECTED)

**Test is COMPLETE if:**
- ✅ All above + device selection menu opens
- ✅ All above + connection to Chromecast succeeds
- ✅ All above + playback works on TV
- ✅ All above + controls work from phone

---

## Quick Reference: Expected Console Logs

**Normal Initialization (No Devices):**
```
[CastButton] Component mounted
[CastButton] Cast SDK initialization started
[CastButton] Setting up Cast SDK with options: { receiverApplicationId: "CC1AD845", autoJoinPolicy: "ORIGIN_SCOPED", language: "en-US", resumeSavedSession: true }
[CastButton] Cast SDK loaded successfully
[CastButton] Cast state changed: NO_DEVICES_AVAILABLE
```

**With Chromecast Available:**
```
[CastButton] Component mounted
[CastButton] Cast SDK initialization started
[CastButton] Setting up Cast SDK with options: {...}
[CastButton] Cast SDK loaded successfully
[CastButton] Cast state changed: NOT_CONNECTED
[CastButton] Devices available! Button enabled
```

**Connection Flow:**
```
[CastButton] User clicked Cast button
[CastButton] Opening device selection dialog
[CastButton] Cast state changed: CONNECTING
[CastButton] Cast state changed: CONNECTED
[CastButton] Connected to: Living Room TV
[CastButton] Session started: SESSION_ID_HERE
```

**Error Logs (Report Immediately):**
```
❌ [CastButton] ERROR: Cast SDK failed to load
❌ [CastButton] ERROR: window.cast is undefined after timeout
❌ Refused to load script from 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js'
❌ Content Security Policy violation
```

---

## Next Steps After Testing

1. **Share results** with development team
2. **Include console logs** (most important!)
3. **Include screenshots**
4. **Describe any issues** encountered
5. Development team will analyze and fix bugs (if any)

---

**Last Updated:** January 16, 2026
**Test Version:** Chromecast Integration v1.0
**Compatible with:** iOS Safari 13+, Chromecast 2nd gen+
