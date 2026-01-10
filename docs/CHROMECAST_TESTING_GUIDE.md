# Chromecast/TV Casting - Testing Guide

**Date:** January 10, 2026
**Feature:** Google Cast support for streaming Pilates classes to TV/Chromecast

## Overview

The Bassline Pilates app now supports casting classes to TV using Google Cast (Chromecast). Users can play classes on their TV while using their phone as a remote control.

## What Works

- ✅ **Audio streaming:** Background music plays on TV
- ✅ **Metadata display:** Class name, movement name, and music info shown on TV
- ✅ **Playback sync:** Play/pause controls on phone sync with TV
- ✅ **Auto-advance:** Class automatically advances through sections on TV
- ✅ **Battery-friendly:** Phone becomes remote control (low battery usage)
- ✅ **No app required:** Works in mobile browser (Safari/Chrome)

## Requirements

### Hardware
- **Chromecast device** (any generation) OR **Google TV** OR **Android TV** OR **Smart TV with Chromecast built-in**
- **Mobile phone** (iPhone or Android) on same WiFi network as TV
- **WiFi network** (both devices must be connected to same network)

### Software
- **Mobile browser:** Safari (iOS 14+) or Chrome (Android 5+)
- **Internet connection:** Active internet (for streaming audio)

## Test Setup

### Step 1: Verify WiFi Connection
1. Check that TV/Chromecast is powered on
2. Verify TV/Chromecast is connected to WiFi (Settings → Network)
3. Verify phone is on **same WiFi network** as TV
4. Note: 5GHz and 2.4GHz networks are separate - both devices must be on same band

### Step 2: Open App on Phone
1. Open mobile browser (Safari on iPhone, Chrome on Android)
2. Navigate to: https://bassline-dev.netlify.app (dev) or https://basslinemvp.netlify.app (production)
3. Log in to your account
4. Generate or select a class to play

## Testing Steps

### Test 1: Basic Casting Connection

**Steps:**
1. Start a class on your phone
2. Look for the **Cast icon** (📡) in the top right corner of the playback screen
3. Tap the Cast icon
4. Select your TV/Chromecast from the list of available devices
5. Wait for connection (should take 2-5 seconds)

**Expected Results:**
- ✅ Cast icon changes color (burgundy background) when connected
- ✅ TV displays "Bassline Pilates" app with class name
- ✅ Background music starts playing on TV speakers
- ✅ Phone shows "Connected to TV" indicator

**Troubleshooting:**
- ❌ No devices shown: Verify both devices on same WiFi
- ❌ Connection fails: Restart Chromecast (unplug for 10 seconds)
- ❌ Cast icon missing: Refresh page and try again

### Test 2: Playback Controls Sync

**Steps:**
1. With class casting to TV, tap **Pause** on phone
2. Verify audio stops on TV
3. Tap **Play** on phone
4. Verify audio resumes on TV
5. Tap **Next** to skip to next section
6. Verify TV advances to next section

**Expected Results:**
- ✅ Pause on phone = pause on TV (immediate sync, <1s delay)
- ✅ Play on phone = play on TV (immediate sync, <1s delay)
- ✅ Skip on phone = skip on TV (new section loads on TV)
- ✅ Rewind on phone = rewind on TV (previous section loads on TV)

**Troubleshooting:**
- ❌ Lag > 3 seconds: Check WiFi signal strength
- ❌ Controls not syncing: Disconnect and reconnect Cast

### Test 3: Metadata Display on TV

**Steps:**
1. Start casting a class
2. Look at TV screen during different sections

**Expected Results:**
- ✅ **Title shows:** Movement name (e.g., "The Hundred", "Roll Up")
- ✅ **Subtitle shows:** Music playlist (e.g., "Baroque Music", "Romantic Music")
- ✅ **Thumbnail shows:** Bassline logo
- ✅ **Duration shows:** Section duration countdown (e.g., "3:45 remaining")

**Troubleshooting:**
- ❌ No metadata: Check internet connection (metadata requires online)
- ❌ Wrong info shown: Report as bug with screenshot

### Test 4: Audio Ducking During Voiceover

**Steps:**
1. Cast a class that includes voiceover sections (e.g., Preparation, Warmup)
2. Listen to TV audio during voiceover
3. Note volume changes

**Expected Results:**
- ✅ **Before voiceover:** Music plays at 100% volume on TV
- ✅ **During voiceover:** Music ducks to 10% volume on TV (voiceover clear)
- ✅ **After voiceover:** Music returns to 100% volume on TV
- ✅ Smooth fade transitions (not abrupt)

**Troubleshooting:**
- ❌ Voiceover not playing: Check if section has voiceover enabled
- ❌ Music too loud during voiceover: Report as bug (ducking may not be working on TV)

### Test 5: Auto-Advance Through Class

**Steps:**
1. Cast a full 30-minute class
2. Let class run without interaction (hands-off test)
3. Observe TV as sections change

**Expected Results:**
- ✅ Class advances automatically through all 6 sections:
  1. Preparation
  2. Warmup
  3. Main movements (with transitions)
  4. Cooldown
  5. Meditation
  6. HomeCare
- ✅ Music continues seamlessly between sections
- ✅ No gaps or pauses between sections
- ✅ Timer counts down correctly on TV

**Troubleshooting:**
- ❌ Class stops mid-way: Check phone didn't lock (keep screen on)
- ❌ Audio gaps between sections: Report as bug

### Test 6: Disconnecting Cast

**Steps:**
1. While casting, tap Cast icon on phone
2. Select "Stop Casting" or disconnect
3. Verify connection ends

**Expected Results:**
- ✅ TV returns to Chromecast home screen
- ✅ Audio stops playing on TV
- ✅ Playback continues on phone (local audio)
- ✅ Cast icon returns to normal color (not burgundy)

**Troubleshooting:**
- ❌ Can't disconnect: Force close browser and reopen
- ❌ Audio stuck on TV: Power cycle Chromecast

## Known Limitations

### Phase 1 (Current)
- ❌ **Video not supported:** Movement videos play on phone only, not TV (audio-only casting)
- ❌ **Voiceover may not duck on all devices:** Some older Chromecasts may play music at full volume during voiceover

### Future Phases
- 📋 **Phase 2 (Planned):** Add movement video casting to TV (picture-in-picture or fullscreen)
- 📋 **Phase 3 (Planned):** Add queue management (cast multiple classes in sequence)

## Browser Compatibility

| Browser | OS | Casting Support | Notes |
|---------|-----|-----------------|-------|
| Safari | iOS 14+ | ✅ Full support | Recommended for iPhone users |
| Chrome | iOS 14+ | ✅ Full support | Alternative for iPhone users |
| Chrome | Android 5+ | ✅ Full support | Recommended for Android users |
| Firefox | iOS/Android | ⚠️ Limited | Cast icon may not appear |
| Edge | iOS/Android | ✅ Full support | Uses Chromium Cast support |

## Reporting Issues

If you encounter any issues during testing, please report:

1. **Device info:**
   - Phone model and OS version (e.g., iPhone 14, iOS 17.2)
   - TV/Chromecast model (e.g., Chromecast 3rd Gen, Google TV)
2. **WiFi info:**
   - Same network? (Yes/No)
   - WiFi band? (2.4GHz or 5GHz)
3. **Issue details:**
   - What happened? (e.g., "Cast icon not appearing")
   - Expected behavior? (e.g., "Should show Cast icon")
   - Steps to reproduce? (numbered list)
4. **Screenshots:**
   - Phone screen (showing issue)
   - TV screen (if relevant)

**Submit reports to:** /beta-feedback page on app or email laura@basslinepilates.com

## Success Criteria

✅ **All tests pass** = Feature ready for beta launch
⚠️ **1-2 tests fail** = Fix issues before launch
❌ **3+ tests fail** = Requires debugging session

## Additional Notes

- **Battery usage:** Phone battery drains ~10-15% per hour when used as Cast remote (minimal compared to playing locally)
- **Internet usage:** ~2-3 MB per minute for audio streaming to TV (similar to local playback)
- **Wake Lock:** Phone screen can sleep while casting (Cast session stays active)
- **Multi-device:** Only one phone can control Cast session at a time

## Next Steps After Testing

1. ✅ Complete all 6 test scenarios above
2. ✅ Document any issues found
3. ✅ Test on multiple devices (iPhone + Android + different Chromecast models)
4. ✅ Share feedback via /beta-feedback or email
5. ✅ Request video casting feature (Phase 2) if needed
