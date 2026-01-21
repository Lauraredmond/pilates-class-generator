# Video Fade Out Analysis

## Expected Behavior (from commits)

1. **Video plays once** (no loop attribute)
2. **When video ends naturally:**
   - `onEnded` event fires
   - `handleVideoEnded()` is called
   - Waits 3 seconds (video stays visible)
   - Sets `videoEnded = true`
   - CSS transition applies: `opacity: 0` over 1 second
3. **Total timeline:** Video visible for 3s after ending, then 1s fade

## Current Code Flow

### When Video Ends:
```javascript
const handleVideoEnded = useCallback(async () => {
  // 1. Check if in fullscreen
  if (isFullscreen) {
    // Exit fullscreen first
    await exitFullscreen();
    await wait(500ms);
  }

  // 2. Wait 3 seconds
  fadeOutTimeoutRef.current = setTimeout(() => {
    setVideoEnded(true); // Triggers opacity: 0
  }, 3000);
}, [isFullscreen]);
```

### When Section Changes:
```javascript
// In URL change handler:
if (previousVideoUrlRef.current !== currentVideoUrl) {
  // NEW: Exit fullscreen if needed (async)
  await exitFullscreenIfNeeded();

  // Force video visible (overrides any fade)
  video.style.opacity = '1';
  video.style.transition = 'none';

  // Load new video
  video.src = currentVideoUrl;
  video.load();

  // Reset states
  setVideoEnded(false);
  setVideoLoading(false);
}

// In section change effect:
if (fadeOutTimeoutRef.current) {
  clearTimeout(fadeOutTimeoutRef.current); // Cancels pending fade
  fadeOutTimeoutRef.current = null;
}
```

## Potential Issues

### 1. **Section Changes Before Video Ends**
- If section duration < video duration, video never reaches `ended` state
- No `onEnded` event = no fade out
- Example: 30-second section, 45-second video

### 2. **Race Condition with Async Fullscreen Exit**
- My fix today made URL change handler async
- This might delay the opacity reset, but shouldn't prevent fade

### 3. **Fade Timeout Cancelled on Section Change**
- If user manually advances or section auto-advances
- The 3-second fade timeout gets cancelled
- This is CORRECT behavior (prevents old fade affecting new section)

## Root Cause Analysis

**Most Likely Issue:** Videos aren't reaching their natural end before sections change.

**Why it worked yesterday:**
- Before the fullscreen fix, the timing was synchronous
- Videos might have been ending just in time

**Why it's not working now:**
- The async fullscreen exit might be delaying video load
- Videos start later, don't finish before section ends

## Solution Options

1. **Check if videos are actually ending:**
   - Add logging to verify `onEnded` event fires
   - Compare video duration vs section duration

2. **Force fade at section end (not video end):**
   - Start fade 4 seconds before section ends
   - Regardless of video completion state

3. **Adjust video/section timing:**
   - Ensure videos are shorter than sections
   - Or extend section duration slightly

## Test Plan

1. Log when `onEnded` fires
2. Log video duration vs time played
3. Log when section changes
4. Verify if fade timeout is being set but cancelled