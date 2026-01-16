# Playwright Full Clickthrough Test Guide

**Last Updated:** January 16, 2026
**Status:** Ready for testing

---

## Overview

This guide explains how to run the comprehensive Playwright E2E test that covers:

1. **Full user journey** (login → class generation → playback → exit)
2. **Chromecast button debugging** (detects greyed-out state and logs SDK initialization)
3. **Screenshot capture** (16 screenshots at every critical step)
4. **Console log monitoring** (captures all Cast-related logs)
5. **iOS PWA compatibility** (tests exit modal buttons with touch events)

---

## Quick Start

### 1. Prerequisites

Ensure you have a test user account in the dev database:

```bash
# Set environment variables
export TEST_USER_EMAIL="test@bassline.dev"
export TEST_USER_PASSWORD="TestPassword123!"
```

**Or** create `frontend/.env.test`:
```
TEST_USER_EMAIL=test@bassline.dev
TEST_USER_PASSWORD=TestPassword123!
```

### 2. Run Full Clickthrough Test (Desktop)

```bash
cd frontend
npm run test:e2e:clickthrough:dev
```

**What this does:**
- Opens Chrome browser (visible - you can watch it run)
- Logs in with test user
- Generates a 30-minute Beginner class (database mode)
- Starts playback
- Tests Chromecast button and logs state
- Tests exit modal buttons (iOS fix)
- Takes 16 screenshots (saved to `frontend/screenshots/`)
- Prints detailed console logs and Chromecast debug info

**Expected Duration:** ~60 seconds

---

### 3. Run Chromecast-Only Test (Faster)

If you only want to debug the Chromecast button without the full clickthrough:

```bash
cd frontend
npm run test:e2e:cast
```

**What this does:**
- Logs in
- Navigates directly to an existing class playback
- Debugs Chromecast button state
- Logs Cast SDK initialization steps
- Takes 2 screenshots (`cast-debug-01-initial.png`, `cast-debug-02-button.png`)

**Expected Duration:** ~20 seconds

---

### 4. Run on Mobile (iPhone Simulation)

```bash
cd frontend
npm run test:e2e:clickthrough:mobile
```

**What this does:**
- Runs the full clickthrough test in iPhone 12 simulator
- Tests touch events on exit modal buttons
- Verifies iOS PWA behavior
- Same screenshots + console logs

**Expected Duration:** ~60 seconds

---

## Test Output

### Screenshots

After running the test, check `frontend/screenshots/`:

```
01-login-page.png               - Login page loaded
02-login-filled.png             - Credentials entered
03-dashboard.png                - Dashboard after login
04-class-builder.png            - Class builder page
05-form-filled.png              - Form filled (Beginner, 30 min)
06-generation-results.png       - Generated class results modal
07-class-saved.png              - Class saved to library
08-classes-library.png          - Classes library page
09-playback-started.png         - Playback page loaded
10-cast-button.png              - Chromecast button closeup
11-cast-button-clicked.png      - After clicking Cast button
12-chromecast-debug-complete.png - Full playback page with Cast debug
13-exit-modal.png               - Exit confirmation modal
14-modal-continue-clicked.png   - After clicking "Continue Class"
15-exit-modal-again.png         - Exit modal second time
16-exited-playback.png          - After exiting playback
```

**Chromecast-only test:**
```
cast-debug-01-initial.png       - Playback page initial state
cast-debug-02-button.png        - Chromecast button closeup
```

### Console Logs

The test prints detailed console output:

```
=== TEST SUMMARY ===
Total console messages captured: 45
Chromecast-related logs: 8
Screenshots saved: 16 screenshots in screenshots/ directory

=== CAST SDK LOADING STEPS ===
1. Script tag exists: ✅
2. window.cast exists: ✅
3. cast.framework exists: ✅
4. CastContext: {"exists":true,"state":"NO_DEVICES_AVAILABLE"}

=== CAST BUTTON STATE ===
{
  "className": "opacity-50 cursor-not-allowed",
  "disabled": false,
  "ariaDisabled": "true",
  "ariaLabel": "Google Cast",
  "textContent": ""
}

Button is greyed out: ❌ YES (ISSUE)

=== CAPTURED [CastButton] LOGS ===
[CastButton] Component mounted, waiting for Cast SDK...
[CastButton] Cast SDK already loaded, initializing immediately
[CastButton] 🎥 Google Cast initialized successfully
[CastButton] Cast state: NO_DEVICES_AVAILABLE
```

---

## Chromecast Debugging Checklist

The test automatically checks these critical steps:

### Step 1: Script Tag Loaded?
✅ **Expected:** `<script src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1">`

❌ **If missing:** CSP blocking or script tag removed

### Step 2: window.cast Object?
✅ **Expected:** `typeof window.cast !== 'undefined'`

❌ **If missing:** Cast SDK script failed to load

### Step 3: cast.framework Available?
✅ **Expected:** `typeof window.cast.framework !== 'undefined'`

❌ **If missing:** Cast SDK loaded but framework didn't initialize

### Step 4: CastContext Created?
✅ **Expected:** `CastContext.getInstance()` succeeds, returns context with state

❌ **If error:** Cast SDK initialization failed

**Possible states:**
- `NO_DEVICES_AVAILABLE` - SDK loaded, but no Chromecast found on network
- `NOT_CONNECTED` - SDK loaded, Chromecast found, not connected
- `CONNECTING` - Connection in progress
- `CONNECTED` - Connected to Chromecast

### Step 5: Button State
✅ **Expected (working):** Button NOT greyed out, `aria-disabled="false"`

❌ **Expected (current issue):** Button greyed out, `opacity-50`, `aria-disabled="true"`

---

## Common Issues & Solutions

### Issue 1: Test Fails at Login
**Symptom:** `Error: Timeout waiting for /dashboard`

**Cause:** Test user doesn't exist in database

**Solution:**
1. Create test user in Supabase Auth
2. Or update `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` to match existing user

---

### Issue 2: No Chromecast Logs Captured
**Symptom:** `⚠️ NO [CastButton] logs captured - component may not be initializing`

**Possible Causes:**
1. CastButton component not imported in ClassPlayback.tsx
2. CastButton removed from JSX
3. Component throwing error before first log
4. Old bundle deployed (recent changes not live)

**Debug Steps:**
```bash
# Check if CastButton is imported
grep -n "CastButton" frontend/src/components/class-playback/ClassPlayback.tsx

# Expected output:
# 15: import { CastButton } from '../CastButton';
# 986: <CastButton onCastStateChange={handleCastStateChange} />
```

**Solution:** If missing, re-add CastButton import and component

---

### Issue 3: Cast SDK Script 404
**Symptom:** Console logs show `Cannot load https://www.gstatic.com/cv/js/sender/v1/cast_sender.js`

**Cause:** CSP blocking gstatic.com

**Solution:**
1. Check `frontend/public/_headers` has `script-src` with `https://www.gstatic.com`
2. Clear browser cache
3. Verify Netlify deployment applied `_headers` file

---

### Issue 4: Button Greyed Out but SDK Loaded
**Symptom:**
- ✅ Cast SDK loaded
- ✅ CastContext created
- ❌ Button still greyed out

**Root Cause:** CastButton component may be checking wrong state or missing state update

**Debug:**
1. Check `CastButton.tsx` component code
2. Verify `CAST_STATE_CHANGED` event listener
3. Check if `setIsAvailable(true)` is being called when state changes

**Solution:** Update CastButton state management

---

### Issue 5: Exit Modal Buttons Don't Work on Mobile
**Symptom:** Clicking "Continue Class" or "Exit" buttons does nothing on iPhone simulator

**Cause:** iOS Safari doesn't fire `onClick` events reliably in modals

**Solution:** ✅ Already fixed! (Commit 532382cc)
- Added `onTouchEnd` handlers
- Added `touchAction: 'manipulation'` CSS
- Test verifies both buttons work

---

## Advanced Usage

### Run with Slow Motion (Easier to Watch)

```bash
npx playwright test e2e/full-clickthrough-with-cast.spec.ts --project='dev-chromium' --headed --slowMo=1000
```

**Effect:** 1-second delay between each action (easier to see what's happening)

---

### Run with Debugger (Step Through Code)

```bash
npx playwright test e2e/full-clickthrough-with-cast.spec.ts --project='dev-chromium' --debug
```

**Effect:** Pauses before each action, shows Playwright Inspector

---

### Run Only Specific Test

```bash
# Full clickthrough only
npx playwright test e2e/full-clickthrough-with-cast.spec.ts --grep 'FULL CLICKTHROUGH'

# Chromecast debug only
npx playwright test e2e/full-clickthrough-with-cast.spec.ts --grep 'CHROMECAST ONLY'
```

---

### Generate HTML Report

```bash
npm run test:e2e:clickthrough:dev
npm run test:e2e:report
```

**Effect:** Opens interactive HTML report with screenshots, traces, and logs

---

## Environment Variables

Create `frontend/.env.test` to customize:

```bash
# Test user credentials
TEST_USER_EMAIL=test@bassline.dev
TEST_USER_PASSWORD=TestPassword123!

# Environment to test (dev or production)
TEST_ENV=dev

# Optional: Chromecast device IP for real device testing
CHROMECAST_IP=192.168.1.100
```

---

## CI/CD Integration (Future)

To run in GitHub Actions CI/CD:

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: |
          cd frontend
          npm ci
          npx playwright install --with-deps

      - name: Run E2E tests
        env:
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
        run: |
          cd frontend
          npm run test:e2e:clickthrough:dev

      - name: Upload screenshots
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: screenshots
          path: frontend/screenshots/
```

---

## Troubleshooting

### Clear All Screenshots

```bash
rm -rf frontend/screenshots/*.png
```

### Reinstall Playwright Browsers

```bash
cd frontend
npx playwright install
```

### Update Playwright

```bash
cd frontend
npm install -D @playwright/test@latest
npx playwright install
```

---

## Next Steps

### If Chromecast Button Working:
- Test with real Chromecast device
- Verify Cast media playback works
- Test remote controls (play/pause/skip)

### If Chromecast Button Still Greyed Out:
1. Review captured screenshots (`cast-debug-*.png`)
2. Check console logs for Cast SDK errors
3. Verify CastContext state
4. Debug CastButton component state management

---

## Support

**Documentation:**
- Playwright Docs: https://playwright.dev/docs/intro
- Google Cast SDK: https://developers.google.com/cast/docs/web_sender

**Related Docs:**
- `/docs/CHROMECAST_TESTING_GUIDE.md` - Manual Chromecast testing steps
- `/docs/CHROMECAST_DEBUG_LOG.md` - Detailed debugging history
- `/docs/IOS_PWA_TESTING_GUIDE.md` - iOS PWA testing scenarios

**Files:**
- Test: `/frontend/e2e/full-clickthrough-with-cast.spec.ts`
- Config: `/frontend/playwright.config.ts`
- CastButton: `/frontend/src/components/CastButton.tsx`

---

**Happy Testing! 🎭**
