# iOS PWA Testing Guide

**Status:** Ready for iOS device testing
**Debug Infrastructure:** Complete (Phase 1-3)
**Last Updated:** January 2026

---

## Overview

This guide explains how to test the Bassline Pilates PWA on iOS devices in standalone mode. The app now has comprehensive debug instrumentation to help diagnose audio/video issues specific to iOS PWAs.

---

## Pre-Testing Setup

### 1. Enable Debug Mode

On your iOS device, open Safari and navigate to:
```
https://bassline-dev.netlify.app
```

Then run this in the console (or add via eruda console):
```javascript
localStorage.setItem('bassline_debug_mode', 'true');
window.location.reload();
```

**Expected Result:** Eruda debug console icon appears in bottom-right corner.

### 2. Add to Home Screen

1. Tap the **Share** button in Safari
2. Scroll down and tap **Add to Home Screen**
3. Tap **Add** to confirm
4. Find the Bassline icon on your home screen

### 3. Launch in Standalone Mode

**IMPORTANT:** Always launch from the home screen icon, NOT from Safari. This ensures you're testing the PWA in standalone mode (where iOS audio issues occur).

---

## Testing Checklist

### Test 1: AudioContext Initialization

**What to test:**
- Launch app from home screen
- Open eruda console (tap icon bottom-right)
- Navigate to "Media" tab

**Expected Results:**
```
AudioContext
  State: running
  Sample Rate: 48000 Hz
  Base Latency: 0.005 s (or similar)
```

**What to look for:**
- ❌ State: `not-created` → AudioContext failed to initialize
- ❌ State: `suspended` → AudioContext suspended on launch
- ✅ State: `running` → AudioContext initialized correctly

**If failed:**
- Check console logs for "AudioContext initialization FAILED"
- Check sessionStorage `media_debug_logs` for error details
- Try manual play button to retry initialization

---

### Test 2: Music Playlist Loading

**What to test:**
1. Generate a class (any difficulty/duration)
2. Open eruda console → "Media" tab
3. Check sessionStorage `media_debug_logs`

**Expected Events (in order):**
```
Fetching playlists START
  → movementStyle: "Baroque"
  → cooldownStyle: "Impressionist"

Movement playlist LOADED
  → playlistName: "Baroque Music"
  → trackCount: 9
  → totalDuration: "30 min"

Cooldown playlist LOADED
  → playlistName: "Impressionist Music"
  → trackCount: 6
  → totalDuration: "20 min"
```

**What to look for:**
- ❌ `BOTH playlists FAILED` → API error or network issue
- ❌ `Movement playlist EMPTY` → No tracks for requested style
- ✅ Both playlists loaded with track counts

---

### Test 3: Music Playback

**What to test:**
1. Start class playback
2. Tap "Click to Enable Audio" button
3. Listen for music to start

**Expected Events:**
```
PLAY requested
  → contextState: "running"
  → musicHasSrc: true

Music: loadstart
  → src: "https://archive.org/..."

Music: loadedmetadata
  → duration: 180
  → networkState: 2

Music: canplaythrough
  → readyState: 4

Music: playing
  → currentTime: 0
  → volume: 1
```

**What to look for:**
- ❌ `PLAY ERROR` → Autoplay blocked or no src
- ❌ `Music: ERROR` with code 2 → Network failure
- ❌ `Music: ERROR` with code 4 → Source not supported
- ❌ `Music: waiting (buffering)` for >5s → Slow network
- ✅ `Music: playing` → Playback started successfully

---

### Test 4: Voiceover Playback

**What to test:**
1. Ensure voiceover is enabled for preparation section
2. Start class playback
3. Tap "Click to Enable Audio" button
4. Listen for voiceover to start and music to duck

**Expected Events:**
```
Voiceover: loadstart
  → src: "https://[supabase-url]/voiceovers/prep_01.mp3"

Voiceover: canplaythrough
  → readyState: 4

Voiceover: play (ducking music)
  → targetVolume: 0.1

Music: volume change (ducking)
  → from: 1.0
  → to: 0.1
  → reason: "voiceover playing"

Voiceover: ended (restoring music)
  → duration: 30
  → targetVolume: 1.0

Music: volume change (ducking)
  → from: 0.1
  → to: 1.0
  → reason: "voiceover ended"
```

**What to look for:**
- ❌ Voiceover doesn't play → Check src URL validity
- ❌ Music doesn't duck → Check Web Audio API connection
- ❌ Music doesn't restore → Check 'ended' event listener
- ✅ Voiceover plays, music ducks to 10%, restores to 100%

---

### Test 5: Screen Wake During Class

**What to test:**
1. Start class playback
2. Let phone screen auto-lock (30 seconds of no touch)
3. Unlock phone and return to app

**Expected Events:**
```
Wake Lock ACQUIRED
  → isPaused: false
  → documentVisible: true

[30 seconds pass...]

[Screen locks, then unlocks]

Page visible
  → contextState: "suspended"
  → musicPaused: true
  → voiceoverPaused: true

AudioContext resume attempt
  → state: "suspended"

AudioContext resumed SUCCESS
  → newState: "running"

Resume music after wake
  → src: "https://archive.org/..."

Music resumed SUCCESS
```

**What to look for:**
- ❌ `Wake Lock API not supported` → iOS version too old (<16.4)
- ❌ `Wake Lock ERROR` → Browser security policy blocked
- ❌ `AudioContext resume FAILED` → iOS suspended without recovery
- ❌ `Music resume FAILED` → Autoplay policy blocked after wake
- ✅ Screen stays on during playback (no auto-lock)
- ✅ Music resumes automatically after unlock

---

### Test 6: Phone Sleep/Wake Recovery

**What to test:**
1. Start class playback
2. Manually lock phone (press power button)
3. Wait 10 seconds
4. Unlock phone and return to app

**Expected Events:**
```
Page hidden
  → contextState: "running"
  → isPaused: false

[Phone locked]

Page visible
  → contextState: "suspended"
  → musicPaused: true

AudioContext resume attempt
AudioContext resumed SUCCESS

Resume music after wake
Music resumed SUCCESS
```

**What to look for:**
- ❌ AudioContext stays `suspended` after wake → iOS recovery failed
- ❌ Music doesn't resume → Autoplay policy blocked
- ✅ Music resumes playing within 1-2 seconds

---

### Test 7: Focus Event Fallback (iOS-specific)

**What to test:**
1. Start class playback
2. Switch to another app (e.g., Messages)
3. Return to Bassline app

**Expected Events:**
```
Page hidden
  → contextState: "running"

[Switch apps]

Page visible
  → contextState: "suspended"

Focus event - AudioContext suspended
  → state: "suspended"

AudioContext resume attempt
AudioContext resumed SUCCESS
```

**What to look for:**
- ❌ No `Focus event` logged → iOS didn't fire focus event
- ❌ `AudioContext resume FAILED` → Recovery failed
- ✅ Both `Page visible` AND `Focus event` logged (redundancy)
- ✅ Music resumes after app switch

---

### Test 8: AudioContext Health Check

**What to test:**
1. Start class playback
2. Let class play for 30 seconds without interruption
3. Check logs every 5 seconds

**Expected Events (every 5 seconds):**
```
AudioContext health check OK
  → state: "running"
  → baseLatency: 0.005
```

**What to look for:**
- ✅ Health check logs every 5 seconds with `state: "running"`
- ❌ `AudioContext health check FAILED - suspended` → Unexpected suspend
- ❌ `AudioContext health check RECOVERY FAILED` → Can't recover
- ✅ If suspended detected → `AudioContext health check RECOVERED` appears

---

## Common Issues & Solutions

### Issue 1: Music Never Plays

**Symptoms:**
- "Click to Enable Audio" button stays visible
- No `Music: playing` event in logs
- AudioContext state is `suspended`

**Diagnosis:**
```javascript
// Check AudioContext state
window.__AUDIO_CONTEXT__.state
// Should be: "running"

// Check music element
document.querySelectorAll('audio')
// Should show 2 elements: music + voiceover
```

**Possible Causes:**
1. **Autoplay blocked** → Tap "Click to Enable Audio" button
2. **No src set** → Check playlist loading logs
3. **Network error** → Check `Music: ERROR` logs for error code
4. **AudioContext failed** → Check initialization logs

**Fix:**
1. Tap "Click to Enable Audio" button (provides user gesture)
2. Check network connectivity
3. Try reloading app
4. Check console for detailed error messages

---

### Issue 2: Music Stops After Screen Lock

**Symptoms:**
- Music plays initially
- Stops when phone screen locks
- Doesn't resume when unlocking

**Diagnosis:**
```javascript
// Check visibility change events
JSON.parse(sessionStorage.getItem('media_debug_logs'))
  .filter(log => log.event.includes('visible'))
```

**Possible Causes:**
1. **Wake Lock not acquired** → Check if Wake Lock API supported
2. **AudioContext not resuming** → Check resume attempt logs
3. **Play promise rejected** → Check autoplay policy

**Fix:**
1. Ensure iOS version ≥16.4 (Wake Lock support)
2. Check for `AudioContext resumed SUCCESS` after wake
3. Look for `Music resume FAILED` errors in logs

---

### Issue 3: Voiceover Doesn't Play

**Symptoms:**
- Music plays correctly
- Voiceover section starts but no voice
- Music doesn't duck

**Diagnosis:**
```javascript
// Check voiceover URL
JSON.parse(sessionStorage.getItem('media_debug_logs'))
  .filter(log => log.type === 'voiceover')
```

**Possible Causes:**
1. **Voiceover not enabled for section** → Check `voiceover_enabled` flag
2. **Invalid src URL** → Check `Voiceover: ERROR` logs
3. **Web Audio API disconnected** → Check source node connection

**Fix:**
1. Verify voiceover file exists in Supabase Storage
2. Check CORS configuration for Supabase
3. Verify Web Audio API connections intact

---

### Issue 4: AudioContext Randomly Suspends

**Symptoms:**
- Music playing, then stops unexpectedly
- No visibility change occurred
- Health check logs show `state: "suspended"`

**Diagnosis:**
```javascript
// Check health check logs
JSON.parse(sessionStorage.getItem('media_debug_logs'))
  .filter(log => log.event.includes('health check'))
```

**Possible Causes:**
1. **iOS aggressive power management** → Health check should catch and recover
2. **Memory pressure** → iOS suspending to free resources
3. **Background tab** → iOS limits background audio

**Fix:**
1. Health check should auto-recover within 5 seconds
2. Look for `AudioContext health check RECOVERED` log
3. If recovery fails, tap "Click to Enable Audio" button

---

## Debug Console Access

### Via Eruda (On-Device)

1. Tap eruda icon (bottom-right)
2. Navigate to tabs:
   - **Console:** Real-time log messages
   - **Media:** Current audio/video state
   - **Network:** API requests and responses
   - **Storage:** sessionStorage with event logs

### Via Safari Web Inspector (Desktop)

1. On iOS device:
   - Settings → Safari → Advanced → Web Inspector (enable)
2. On Mac:
   - Safari → Develop → [Your iPhone] → [Bassline]
   - Console tab shows all debug logs

---

## Exporting Debug Data

### Method 1: Copy from Eruda Console

```javascript
// In eruda console
copy(JSON.stringify(
  JSON.parse(sessionStorage.getItem('media_debug_logs')),
  null,
  2
))
```

Then paste into Notes app or email.

### Method 2: Download Diagnostics Report

```javascript
// In eruda console
const diagnostics = {
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  logs: JSON.parse(sessionStorage.getItem('media_debug_logs') || '[]'),
  audioContext: {
    state: window.__AUDIO_CONTEXT__?.state,
    sampleRate: window.__AUDIO_CONTEXT__?.sampleRate,
    baseLatency: window.__AUDIO_CONTEXT__?.baseLatency
  },
  audioElements: Array.from(document.querySelectorAll('audio')).map(a => ({
    id: a.id,
    src: a.src,
    paused: a.paused,
    currentTime: a.currentTime,
    duration: a.duration,
    readyState: a.readyState,
    networkState: a.networkState,
    error: a.error ? {
      code: a.error.code,
      message: a.error.message
    } : null
  }))
};

copy(JSON.stringify(diagnostics, null, 2));
```

---

## Next Steps After Testing

### If All Tests Pass ✅

The app is working correctly in iOS PWA standalone mode! No further action needed.

### If Issues Found ❌

1. **Export debug logs** (see above)
2. **Note specific issue** (which test failed)
3. **Share with development team**:
   - Test number that failed
   - Expected vs actual behavior
   - Debug log export
   - iOS version (Settings → General → About)

### Priority Issues to Report

1. **AudioContext fails to initialize** (Test 1)
2. **Music never plays** (Test 3)
3. **No recovery after screen lock** (Test 6)
4. **Voiceover doesn't play** (Test 4)

---

## Technical Details

### Phase 1: Debug Infrastructure
- Eruda on-device console
- Custom media diagnostics panel
- Session storage event logging
- AudioContext global exposure

### Phase 2: Instrumentation
- 30+ logging points in useAudioDucking hook
- Component lifecycle logging
- Playlist loading tracking
- Wake Lock event tracking

### Phase 3: iOS PWA Fixes
- Aggressive AudioContext resume strategy
- 100ms wait after resume (iOS timing issue)
- Focus event fallback (iOS visibilitychange unreliable)
- 5-second health check with auto-recovery
- Enhanced error logging and diagnostics

---

## References

- **iOS PWA Audio Best Practices:** https://webkit.org/blog/category/audio/
- **AudioContext API:** https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
- **Wake Lock API:** https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
- **Service Worker:** https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API

---

**Good luck testing! 🎵**
