# Ralph Loop Iteration 2: Implementing Section-Based Fade Out

## Problem Confirmed
User watched videos play naturally in fullscreen but didn't see fade-out. The issue:
- Fade happens AFTER exiting fullscreen (on small video)
- Less visible/noticeable to user
- Timing is: video ends → exit fullscreen (500ms) → wait 3s → fade
- User expects fade to happen IN fullscreen, not after

## Solution: Section-Based Fade Out
Instead of waiting for video to end naturally, trigger fade based on section timing:
- Start fade 4 seconds before section ends
- Works regardless of video length
- Works in fullscreen (fade happens before exit)
- More predictable and reliable

## Implementation Plan
1. Track section remaining time
2. When 4 seconds left: start 3s pause then 1s fade
3. Section changes naturally after fade completes
4. Videos always fade gracefully, even if longer than section

This ensures users SEE the fade-out, especially in fullscreen mode.