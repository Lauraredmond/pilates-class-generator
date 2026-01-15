# Bassline PWA Media Debugging Log

## Date: January 15, 2026

## Phase 0: Playwright Audit Results ✅ COMPLETED (Updated Jan 15, 2026)

### Test Environment
- **Base URL**: https://basslinemvp.netlify.app (production)
- **Playwright Version**: 1.57.0
- **Browsers Tested**: Chromium, Mobile Chrome
- **Test Credentials**: laura.bassline@proton.me / Laura101!! (two exclamation marks)
- **Note**: Mobile Safari tests failed (webkit browser not installed)

### Key Findings

#### 1. ✅ Service Worker Status
- Service Worker is registered and active at `https://bassline-dev.netlify.app/sw.js`
- Cache name: `bassline-v1`
- Cached files: index.html, logo images
- **Good**: No media files in cache (prevents streaming issues)

#### 2. ✅ AudioContext Status
- AudioContext state: `running` (not suspended)
- Sample rate: 48000 Hz
- Base latency: 0.005s
- **Note**: AudioContext properly initialized in test environment

#### 3. ✅ FIXED: Authentication Working (January 15, 2026)
- **Fixed Issue**: Incorrect password in test (was Laura101! should be Laura101!!)
- **Login successful**: Now reaching class builder and playback
- **Medical disclaimer**: Properly handled by answering "No" to pregnancy question
- **Full flow working**: Login → Generate class → Accept plan → Play class

#### 3a. ❌ OLD Authentication Blocker (Resolved)
- **Persistent consent screen**: Yes/No buttons appear on all pages
- **Login page reached**: `/login` URL accessed successfully
- **Login form not visible**: 0 input fields found on login page
- **Consent persists**: Yes/No buttons still showing even on /login
- **Likely cause**: Consent modal overlaying the entire app

#### 4. ❌ Google Cast SDK Error
- **Error**: `net::ERR_FAILED` loading `cast_sender.js`
- **URL**: `https://www.gstatic.com/cv/js/sender/v1/cast_sender.js`
- **Impact**: May affect media playback capabilities
- **Note**: This could be related to PWA media issues

#### 5. ✅ Media Elements Successfully Audited (January 15, 2026)

**Video Elements Found: 1**
- **Source**: `PrepPhase_v2.mp4` from AWS S3
- **Duration**: 115.3 seconds (preparation phase)
- **State**: `HAVE_ENOUGH_DATA` (loaded successfully)
- **Network**: `NETWORK_IDLE` (done loading)
- ✅ Has `playsinline` attribute (critical for iOS)
- ⚠️ Missing `webkit-playsinline` (older iOS compatibility)
- ✅ Video is muted (required for autoplay)
- ⚠️ Video is paused (waiting for user interaction)

**Audio Management:**
- **No HTML audio elements** (managed via Web Audio API)
- **Voiceover**: `1-Preparation-Phase.mp3` (Supabase Storage)
- **Background Music**: Multiple tracks from S3
  - `Eine_kleine_Nachtmusik_K._525_I._Allegro.mp3`
  - `Emperor_s_Hymn_String_Quartet_in_C_.mp3`
- **AudioContext**: Running (not suspended), 48kHz, low latency

**Working Media Flow:**
1. User clicks "Play Class"
2. **Health & Safety Agreement modal appears** (before first class only)
3. User must accept safety agreement to proceed
4. Video loads from S3 (preparation phase) - currently paused
5. Voiceover ready from Supabase
6. Background music ready from S3
7. All managed through Web Audio API for ducking/mixing

**Current Blocker:**
- ⚠️ Health & Safety Agreement modal blocking playback
- This is the `HealthSafetyModal` component (different from medical disclaimer)
- Appears before first class playback only
- Video is loaded but paused until agreement accepted

### Authentication Flow Discovery

1. **Initial page**: Shows Yes/No consent buttons
2. **After clicking "Yes"**: Shows "Refresh Page" button (error state)
3. **After refresh**: Back to Yes/No buttons
4. **Navigation to /login**: Still shows Yes/No buttons (no login form)
5. **Blocker**: Cannot proceed past consent screen to test media

### Updated Hypothesis

The app has a **persistent consent/acceptance modal** that:
1. Overlays the entire application
2. Blocks access to login form
3. Doesn't properly clear after clicking "Yes"
4. Prevents navigation to any functional part of the app
5. May be related to PWA-specific behavior or localStorage state

### Google Cast Integration Issue

The app is trying to load Google Cast SDK which is failing with network error. This could indicate:
- App has Chromecast support built-in
- Network error may be CORS or CSP related
- Could impact media playback functionality

### Critical Issue: Health Consent Form Bug

**Tested on both dev and production environments:**
- Dev: https://bassline-dev.netlify.app
- Production: https://basslinemvp.netlify.app

**The Problem:**
1. Health consent form shows Yes/No buttons
2. Clicking "Yes" appears to succeed ("Successfully passed health consent")
3. Page shows "Refresh Page" button (error state)
4. After refresh, consent form reappears
5. This loops indefinitely
6. **Result: Cannot access the actual app to test media**

**Likely Causes:**
1. **localStorage/Cookie issue**: Consent acceptance not being stored
2. **CORS/CSP issue**: May relate to Google Cast SDK error
3. **Backend validation failing**: Server might be rejecting the consent

**This blocks all further testing** until resolved, as we cannot:
- Access the login form
- Navigate to class builder
- Test any media playback

### iOS PWA-Specific Issues to Address

Based on the successful media audit, here are the specific issues that may affect iOS PWA (Home Screen) mode:

1. **Video Issues:**
   - ⚠️ Missing `webkit-playsinline` attribute (older iOS compatibility)
   - ⚠️ Video paused - needs user gesture to start
   - Consider adding `x-webkit-airplay="allow"` for AirPlay support

2. **Audio Issues:**
   - Using Web Audio API (good for ducking/mixing)
   - May need explicit user gesture on iOS PWA
   - Consider fallback to HTML audio elements

3. **Google Cast SDK:**
   - Loading error may affect casting functionality
   - Consider lazy loading or conditional loading

4. **Next Steps for iOS PWA Testing:**
   - Add `webkit-playsinline` attribute to videos
   - Ensure first user interaction triggers both video and audio
   - Test on physical iPhone with app added to Home Screen
   - Implement debug console for iOS (eruda/vConsole)

---

## Phase 1: Debug Infrastructure (Ready to Start)

### Tasks
- [ ] Install eruda or vConsole for mobile debugging
- [ ] Create custom debug panel component
- [ ] Add media state monitoring
- [ ] Implement localStorage logging
- [ ] Create test harness page

---

## Phase 2: Media Instrumentation (Pending)

### Tasks
- [ ] Add comprehensive event listeners to media elements
- [ ] Log AudioContext operations
- [ ] Wrap media.play() calls
- [ ] Monitor service worker fetch events
- [ ] Add timing information to all logs

---

## Phase 3: iOS PWA Fixes (Pending)

### Known Fixes to Try
- [ ] Add playsinline attribute to videos
- [ ] Add webkit-playsinline for older iOS
- [ ] Gate media playback behind user interaction
- [ ] Resume AudioContext on first touch
- [ ] Test with muted attribute
- [ ] Review service worker media handling

---

## Phase 4: Device Testing (Pending)

### Requirements
- Physical iOS device with Safari
- App added to Home Screen
- Debug panel enabled
- Console log export capability

---

## Test Commands

```bash
# Run all tests
npx playwright test pwa-media-debug.spec.ts --reporter=list

# Run with UI for debugging
npx playwright test pwa-media-debug.spec.ts --ui

# Run only Chromium tests
npx playwright test pwa-media-debug.spec.ts --project=chromium

# Install missing browsers (for Safari)
npx playwright install webkit
```

---

## Notes

- Service Worker is active but not caching (good for media)
- AudioContext is not suspended in test environment
- Main blocker: Tests can't navigate to media playback section
- Need to verify actual app UI and authentication requirements