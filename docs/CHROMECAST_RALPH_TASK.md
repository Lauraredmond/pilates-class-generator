# Chromecast Integration Testing & Debugging Task

## Context from Session 4
- Cast SDK script loads successfully (HTTP 200 OK) ✅
- CastButton component renders correctly ✅
- window.cast undefined in Playwright = expected Chromium limitation
- Manual testing on real device (iPhone Safari) is required

## Phase 1: Playwright Automated Testing (Baseline)
1. Run existing Playwright test: `npm run test:e2e:cast`
2. Verify test passes for:
   - Cast SDK script loads (200 OK)
   - CastButton component visible
   - Button shows correct disabled state (expected when no devices)
3. If test fails: Capture screenshots, console logs, fix test selectors, re-run

## Phase 2: Real Device Testing Preparation
4. Create comprehensive manual test checklist in `docs/CHROMECAST_MANUAL_TEST_GUIDE.md`:
   - Step-by-step iPhone Safari testing instructions
   - Console log collection procedure
   - Expected [CastButton] log messages
   - Device discovery verification steps
   - Cast menu interaction steps
   - Success criteria (button enabled → menu opens → device connects)

## Phase 3: Manual Test Artifact Analysis (User will provide)
5. When user provides console logs from iPhone Safari:
   - Analyze [CastButton] initialization logs
   - Check for Cast SDK loading errors
   - Identify why button is disabled (no devices vs SDK not loaded)
   - Document findings in `CHROMECAST_DEBUG_LOG.md`

## Phase 4: Bug Fixing (If Issues Found)
6. If real bugs discovered:
   - Fix CastButton.tsx initialization logic
   - Fix CSP if blocking Cast SDK
   - Fix event listeners for device discovery
   - Update test to verify fix
   - Re-run Playwright test to confirm no regression

## Phase 5: Completion
7. Update `CHROMECAST_DEBUG_LOG.md` with final status
8. Commit all changes (test fixes, documentation, code fixes)
9. Output: `<promise>CHROMECAST_COMPLETE</promise>`

## Iteration Strategy
- Phase 1 should pass (we know automated test works)
- Phase 2 creates guide for user
- Phase 3-4 iterate based on user's manual test results
- Phase 5 completes when real device testing confirms working

## Failure Handling
- Playwright failures: Fix test selectors, verify SDK loads, add diagnostics
- Manual test failures: Analyze logs, fix CastButton code, update docs
- Environment limitations: Clearly document what works vs what needs real device
- After 8 iterations: Document blockers and recommend next steps

## Success Criteria (ALL must be true)
- ✅ Playwright test passes (Cast SDK loads, button renders)
- ✅ Manual test guide created and comprehensive
- ✅ User's manual test results analyzed
- ✅ Any real bugs fixed and verified
- ✅ Documentation updated with findings
