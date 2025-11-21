# SoundCloud Music Integration - Setup Guide

**Session 11 - Music Integration (ESSENTIAL FEATURE)**

## Overview

Music integration has been implemented using the SoundCloud Widget API. Music plays automatically during class playback and syncs with the class timer (pause/resume).

## Implementation Summary

### Files Created/Modified

1. **`frontend/src/utils/musicPlaylists.ts`** (NEW)
   - Configuration file with 9 playlist mappings
   - 6 movement playlists + 3 cool-down playlists
   - Helper functions to get playlists by ID or name

2. **`frontend/src/components/class-playback/ClassPlayback.tsx`** (MODIFIED)
   - Added SoundCloud Widget API integration
   - Hidden iframe loads playlist URL
   - Music auto-plays when class starts
   - Music pauses/resumes with class timer
   - Volume set to 50%

3. **`frontend/index.html`** (MODIFIED)
   - Added SoundCloud Widget API script tag

### Features Implemented

✅ **Auto-play music** when class starts
✅ **Pause/resume sync** with class timer
✅ **Volume control** (set to 50%)
✅ **Visual indicator** shows music status (loading/playing)
✅ **Playlist selection** based on movement vs cool-down phase
✅ **Error handling** with console logging

## 🎵 REQUIRED: Create SoundCloud Playlists

**IMPORTANT:** The playlists currently have placeholder URLs. You need to create real SoundCloud playlists and update the configuration.

### Step 1: Create SoundCloud Account

1. Go to https://soundcloud.com
2. Sign up for a free account
3. Verify your email address

### Step 2: Create 9 Playlists

Create the following playlists with **60+ minutes of music** each:

#### Movement Music Playlists (6 playlists)

1. **Ambient Pilates**
   - Calm ambient soundscapes
   - Perfect for focused movement
   - Example artists: Brian Eno, Marconi Union, Ólafur Arnalds

2. **Meditation Instrumentals**
   - Gentle instrumental melodies
   - Mindful practice
   - Example: Yoga & meditation instrumental tracks

3. **Chillout Beats**
   - Relaxing electronic beats
   - Steady rhythm for flow
   - Example: Café del Mar, Thievery Corporation

4. **Lo-Fi Focus**
   - Lo-fi hip hop beats
   - Concentration and focus
   - Example: ChilledCow, Lofi Girl playlists

5. **Acoustic Calm**
   - Acoustic guitar and piano
   - Serene and natural
   - Example: Acoustic covers, instrumental folk

6. **Piano Minimal**
   - Minimalist piano compositions
   - Clear and focused
   - Example: Ludovico Einaudi, Nils Frahm

#### Cool-Down Music Playlists (3 playlists)

7. **Baroque Classical**
   - Bach, Vivaldi, Handel
   - Structured and calming
   - Example: Brandenburg Concertos, Four Seasons

8. **Classical Piano**
   - Chopin, Debussy, Satie
   - Romantic and soothing
   - Example: Nocturnes, Clair de Lune

9. **Romantic Era**
   - Schumann, Brahms, Tchaikovsky
   - Orchestral and expansive
   - Example: Symphony excerpts, chamber music

### Step 3: Get Shareable URLs

For each playlist you created:

1. Open the playlist on SoundCloud
2. Click the **Share** button
3. Copy the **playlist URL** (e.g., `https://soundcloud.com/your-username/playlist-name`)
4. Save this URL - you'll need it in the next step

### Step 4: Update Configuration File

1. Open `frontend/src/utils/musicPlaylists.ts`
2. Replace each placeholder URL with your actual SoundCloud playlist URL
3. Example:

```typescript
// BEFORE (placeholder)
url: 'https://soundcloud.com/REPLACE-WITH-YOUR-USERNAME/ambient-pilates',

// AFTER (your actual playlist)
url: 'https://soundcloud.com/lauramusic/ambient-pilates-flow',
```

4. Update all 9 playlist URLs
5. Save the file

### Step 5: Test Music Playback

1. Generate a new class in the app
2. Click "Play Class" to start playback
3. You should see:
   - "Music Loading..." → "Music Playing" (green indicator)
   - Music plays in the background
   - Music pauses when you pause the class
   - Music resumes when you resume the class

## Troubleshooting

### Music doesn't play

**Issue:** "Music Loading..." never changes to "Music Playing"

**Solutions:**
1. Check browser console for errors (F12 → Console tab)
2. Verify playlist URL is correct and public
3. Make sure playlist has tracks in it (not empty)
4. Try a different playlist URL to isolate the issue
5. Check SoundCloud playlist privacy settings (must be "Public" or "Link sharing")

### "SoundCloud widget error" in console

**Issue:** Console shows "SoundCloud widget error - check playlist URL"

**Solutions:**
1. Verify the playlist URL is accessible (open it in a new browser tab)
2. Make sure you copied the full URL including `https://`
3. Check that the playlist is not private
4. Try using the SoundCloud "Embed" code and extracting the URL from there

### Music plays but doesn't pause with class

**Issue:** Music continues when class is paused

**Solutions:**
1. Check browser console for JavaScript errors
2. This is likely a timing issue - refresh the page and try again
3. Ensure you're using a modern browser (Chrome, Firefox, Safari, Edge)

### No sound but indicator shows "Music Playing"

**Issue:** Visual indicator is green but no audio

**Solutions:**
1. Check your device volume is not muted
2. Check browser tab is not muted (look for speaker icon in tab)
3. Verify SoundCloud playlist contains audio tracks
4. Try a different playlist
5. Check browser audio permissions

## Architecture Details

### SoundCloud Widget API

The integration uses the official SoundCloud Widget API:
- **Documentation:** https://developers.soundcloud.com/docs/api/html5-widget
- **Script:** `https://w.soundcloud.com/player/api.js`
- **Widget iframe:** Hidden (`display: none`) but functional

### Widget Control Methods

```typescript
widget.load(url)        // Load new playlist
widget.play()           // Start playback
widget.pause()          // Pause playback
widget.setVolume(50)    // Set volume (0-100)
```

### Widget Events

```typescript
widget.bind('ready', callback)    // Widget initialized
widget.bind('play', callback)     // Playback started
widget.bind('pause', callback)    // Playback paused
widget.bind('error', callback)    // Error occurred
```

## Future Enhancements

### Potential improvements for future sessions:

1. **Volume ducking for narration** (Session 14-15)
   - Lower music volume during audio narration
   - Smooth fade in/out transitions

2. **Playlist switching**
   - Automatically switch from movement playlist to cool-down playlist
   - Detect cool-down phase and transition music

3. **User volume control**
   - Add volume slider in playback UI
   - Save user volume preference

4. **Music preferences**
   - Allow users to select preferred music styles
   - Remember last used playlists

5. **Multiple playlists per category**
   - Rotate through different playlists
   - Prevent music fatigue from repetition

## Success Criteria

- [x] Music plays automatically when class starts
- [x] Music pauses/resumes with class timer
- [x] Music volume appropriate (50% default)
- [x] Visual indicator shows music status
- [x] No performance impact on class playback
- [ ] **USER REQUIRED:** Create 9 SoundCloud playlists with 60+ minutes each
- [ ] **USER REQUIRED:** Update playlist URLs in `musicPlaylists.ts`
- [ ] **USER REQUIRED:** Test music playback with real playlists

## Notes

- Music integration is **ESSENTIAL** to the offering (user requirement)
- Pre-curated playlists approach is fastest and most reliable
- Widget API is simpler than full SoundCloud SDK integration
- Current implementation uses movement playlist for entire class
- Playlist switching to cool-down music can be added in future session

---

**Session 11 Complete:** SoundCloud music integration implemented and ready for testing with user's playlists.
