# Ralph-loop Test Configuration for Mobile Video Fixes

## Test Objective
Fix three critical issues in class playback:
1. Mobile narrative hidden behind video
2. Videos not auto-playing on section transitions
3. Voiceover/video sync appears broken (7-second delay)

## Completion Promise
"All three video playback issues fixed and verified on both mobile and laptop devices"

## Test Command
```bash
npm run test:e2e -- mobile-video-fixes.spec.ts
```

## Iteration Plan

### Iteration 1-2: Mobile Layout Testing
- Test narrative visibility on mobile devices
- Verify video doesn't overlap text
- Check desktop picture-in-picture maintained

### Iteration 3-4: Thumbnail Strategy Testing
- Verify "Preparing demonstration..." appears
- Check progress bar animation (5 seconds)
- Confirm smooth transition to video

### Iteration 5-6: Auto-play Testing
- Test section transitions trigger video reset
- Verify videos play automatically
- Check both movement and non-movement sections

### Iteration 7-8: Cross-device Verification
- Test on multiple viewport sizes
- Verify fixes work on slow networks
- Check browser compatibility

### Iteration 9-10: Edge Cases & Polish
- Handle missing videos gracefully
- Test pause/resume behavior
- Verify all debug logs removed

## Success Metrics

### Mobile (iPhone/Android)
- [ ] Narrative text fully visible below video
- [ ] No z-index overlap issues
- [ ] Smooth scrolling experience
- [ ] Thumbnail shows for 5 seconds
- [ ] Videos auto-play after thumbnail

### Laptop (Desktop browsers)
- [ ] Picture-in-picture maintained
- [ ] Thumbnail shows for movements
- [ ] Videos auto-play on transitions
- [ ] No layout regressions

### Performance
- [ ] Works on 3G network speeds
- [ ] Smooth animations (no jank)
- [ ] Video loads within 2 seconds

## Test Matrix

| Device | Viewport | Priority | Status |
|--------|----------|----------|--------|
| iPhone 14 | 390x844 | HIGH | Pending |
| MacBook Pro | 1440x900 | HIGH | Pending |
| iPad Mini | 768x1024 | MEDIUM | Pending |
| Pixel 7 | 412x915 | MEDIUM | Pending |
| Windows | 1920x1080 | LOW | Pending |

## Debug Checklist
- [ ] Remove all console.log statements
- [ ] Verify no errors in browser console
- [ ] Check network tab for failed requests
- [ ] Validate CSS responsive breakpoints
- [ ] Test with actual video URLs from database

## Ralph-loop Command
```bash
/ralph-loop "Fix mobile video playback issues" \
  --max-iterations 10 \
  --completion-promise "All tests passing on mobile and laptop"
```