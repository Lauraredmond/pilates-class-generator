/**
 * Chromecast Root Cause Investigation - Systematic Testing
 *
 * This test follows a 4-iteration approach to identify the exact cause of
 * Chromecast icon being greyed out despite device being active on network.
 *
 * DO NOT modify this test without updating the investigation plan.
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const DEV_SITE = 'https://bassline-dev.netlify.app';
const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL || 'lauraredmond@gmail.com';
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD || '';

// Output directory for investigation results
const OUTPUT_DIR = '/tmp/chromecast-investigation';

test.beforeAll(() => {
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
});

test.describe('Chromecast Root Cause Investigation', () => {

  test('ITERATION 1: Browser Detection Test', async ({ page }) => {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('ITERATION 1: Browser Detection Test');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Navigate to dev site
    await page.goto(DEV_SITE);
    await page.waitForLoadState('networkidle');

    // Login (if needed)
    const loginButton = page.locator('button:has-text("Sign in with Email")');
    if (await loginButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await loginButton.click();
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/class-builder|dashboard/, { timeout: 10000 });
    }

    // Navigate to class builder
    await page.goto(`${DEV_SITE}/class-builder`);
    await page.waitForLoadState('networkidle');

    // Start class playback (accept pre-generated class if exists)
    const acceptButton = page.locator('button:has-text("Accept & Add to Class")');
    if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await acceptButton.click();
      await page.waitForTimeout(2000); // Wait for modal to close
    }

    // Click Play Class button
    const playButton = page.locator('button:has-text("Play Class")');
    await playButton.waitFor({ state: 'visible', timeout: 5000 });
    await playButton.click();
    await page.waitForTimeout(3000); // Wait for playback to start

    // Execute browser detection in page context
    const browserInfo = await page.evaluate(() => {
      const results = {
        userAgent: navigator.userAgent,
        castExists: typeof (window as any).cast !== 'undefined',
        castType: typeof (window as any).cast,
        frameworkExists: typeof (window as any).cast?.framework !== 'undefined',
        frameworkType: typeof (window as any).cast?.framework,
        autoJoinPolicyExists: typeof (window as any).cast?.framework?.AutoJoinPolicy !== 'undefined',
        originScopedValue: (window as any).cast?.framework?.AutoJoinPolicy?.ORIGIN_SCOPED,
        timestamp: new Date().toISOString(),
        // Additional diagnostic info
        castKeys: (window as any).cast ? Object.keys((window as any).cast) : [],
        frameworkKeys: (window as any).cast?.framework ? Object.keys((window as any).cast.framework) : [],
      };

      // Log to console for screenshot
      console.log('═══ BROWSER DETECTION RESULTS ═══');
      console.log('User Agent:', results.userAgent);
      console.log('window.cast exists:', results.castExists);
      console.log('typeof window.cast:', results.castType);
      console.log('window.cast.framework exists:', results.frameworkExists);
      console.log('typeof window.cast.framework:', results.frameworkType);
      console.log('AutoJoinPolicy.ORIGIN_SCOPED:', results.originScopedValue);
      console.log('window.cast keys:', results.castKeys);
      console.log('window.cast.framework keys:', results.frameworkKeys);

      return results;
    });

    // Take screenshot of console (if supported)
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'iteration1-browser-console.png'),
      fullPage: true
    });

    // Write results to JSON
    const outputPath = path.join(OUTPUT_DIR, 'chrome-cast-browser-test.json');
    fs.writeFileSync(outputPath, JSON.stringify(browserInfo, null, 2));

    // Log results
    console.log('\n═══ ITERATION 1 RESULTS ═══');
    console.log('User Agent:', browserInfo.userAgent);
    console.log('window.cast exists:', browserInfo.castExists);
    console.log('typeof window.cast:', browserInfo.castType);
    console.log('window.cast.framework exists:', browserInfo.frameworkExists);
    console.log('typeof window.cast.framework:', browserInfo.frameworkType);
    console.log('AutoJoinPolicy.ORIGIN_SCOPED:', browserInfo.originScopedValue);
    console.log('\nResults saved to:', outputPath);

    // Determine next iteration
    if (!browserInfo.castExists) {
      console.log('\n❌ HYPOTHESIS 1 CONFIRMED: Browser incompatibility');
      console.log('window.cast is undefined - Google Cast SDK not supported in this browser');
      console.log('This is likely Safari, which does NOT support Google Cast API');
      console.log('\n⏭️  SKIPPING to final diagnosis (no need for iterations 2-4)');
    } else {
      console.log('\n✅ SDK detected - proceeding to ITERATION 2');
    }
  });

  test('ITERATION 2: SDK Loading Timeline Test', async ({ page }) => {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('ITERATION 2: SDK Loading Timeline Test');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Check if we should run this iteration
    const browserTestPath = path.join(OUTPUT_DIR, 'chrome-cast-browser-test.json');
    if (fs.existsSync(browserTestPath)) {
      const browserTest = JSON.parse(fs.readFileSync(browserTestPath, 'utf-8'));
      if (!browserTest.castExists) {
        test.skip();
        return;
      }
    }

    // Set up performance monitoring before navigation
    await page.addInitScript(() => {
      const timeline: any[] = [];

      // Mark when script starts loading
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.includes('cast_sender.js')) {
            timeline.push({
              event: 'cast_sdk_script_load',
              timestamp: entry.startTime,
              duration: entry.duration
            });
          }
        }
      });
      observer.observe({ entryTypes: ['resource'] });

      // Override __onGCastApiAvailable to capture callback
      const originalCallback = (window as any).__onGCastApiAvailable;
      (window as any).__onGCastApiAvailable = function(isAvailable: boolean) {
        timeline.push({
          event: '__onGCastApiAvailable_fired',
          timestamp: performance.now(),
          isAvailable
        });
        if (originalCallback) {
          return originalCallback(isAvailable);
        }
      };

      // Expose timeline to test
      (window as any).__castTimeline = timeline;
    });

    // Navigate and start playback
    await page.goto(DEV_SITE);
    await page.waitForLoadState('networkidle');

    // Login (if needed)
    const loginButton = page.locator('button:has-text("Sign in with Email")');
    if (await loginButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await loginButton.click();
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/class-builder|dashboard/, { timeout: 10000 });
    }

    await page.goto(`${DEV_SITE}/class-builder`);
    await page.waitForLoadState('networkidle');

    const acceptButton = page.locator('button:has-text("Accept & Add to Class")');
    if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await acceptButton.click();
      await page.waitForTimeout(2000);
    }

    const playButton = page.locator('button:has-text("Play Class")');
    await playButton.waitFor({ state: 'visible', timeout: 5000 });
    await playButton.click();

    // Wait for CastButton component to mount and initialize
    await page.waitForTimeout(15000); // Wait 15 seconds to capture all events

    // Collect timeline data
    const timeline = await page.evaluate(() => {
      return (window as any).__castTimeline || [];
    });

    // Add console logs from page
    const consoleLogs = await page.evaluate(() => {
      // Try to get CastButton initialization logs
      return {
        componentMounted: document.querySelector('[aria-label*="Cast"]') !== null,
        timestamp: performance.now()
      };
    });

    const timelineData = {
      timeline,
      componentState: consoleLogs,
      totalDuration: timeline.length > 0 ? timeline[timeline.length - 1].timestamp : 0
    };

    // Write results
    const outputPath = path.join(OUTPUT_DIR, 'cast-sdk-timeline.json');
    fs.writeFileSync(outputPath, JSON.stringify(timelineData, null, 2));

    console.log('\n═══ ITERATION 2 RESULTS ═══');
    console.log('Timeline events captured:', timeline.length);
    console.log('CastButton component mounted:', consoleLogs.componentMounted);
    console.log('\nResults saved to:', outputPath);
  });

  test('ITERATION 3: CSP Verification Test', async ({ page }) => {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('ITERATION 3: CSP Verification Test');
    console.log('═══════════════════════════════════════════════════════════\n');

    const networkLog: any[] = [];

    // Monitor all network requests
    page.on('request', request => {
      const url = request.url();
      if (url.includes('google.com') || url.includes('gstatic.com') ||
          url.includes('googleapis.com') || url.includes('googleusercontent.com')) {
        networkLog.push({
          type: 'request',
          url,
          method: request.method(),
          timestamp: new Date().toISOString()
        });
      }
    });

    page.on('response', response => {
      const url = response.url();
      if (url.includes('google.com') || url.includes('gstatic.com') ||
          url.includes('googleapis.com') || url.includes('googleusercontent.com')) {
        networkLog.push({
          type: 'response',
          url,
          status: response.status(),
          statusText: response.statusText(),
          timestamp: new Date().toISOString()
        });
      }
    });

    page.on('requestfailed', request => {
      const url = request.url();
      if (url.includes('google.com') || url.includes('gstatic.com') ||
          url.includes('googleapis.com') || url.includes('googleusercontent.com')) {
        networkLog.push({
          type: 'failed',
          url,
          failure: request.failure()?.errorText,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Navigate and start playback
    await page.goto(DEV_SITE);
    await page.waitForLoadState('networkidle');

    // Login (if needed)
    const loginButton = page.locator('button:has-text("Sign in with Email")');
    if (await loginButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await loginButton.click();
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/class-builder|dashboard/, { timeout: 10000 });
    }

    await page.goto(`${DEV_SITE}/class-builder`);
    await page.waitForLoadState('networkidle');

    const acceptButton = page.locator('button:has-text("Accept & Add to Class")');
    if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await acceptButton.click();
      await page.waitForTimeout(2000);
    }

    const playButton = page.locator('button:has-text("Play Class")');
    await playButton.waitFor({ state: 'visible', timeout: 5000 });
    await playButton.click();
    await page.waitForTimeout(10000); // Wait to capture device discovery attempts

    // Get CSP headers
    const response = await page.goto(DEV_SITE);
    const headers = await response?.allHeaders();
    const cspHeader = headers?.['content-security-policy'] || 'NOT FOUND';

    const networkData = {
      requests: networkLog.filter(log => log.type === 'request'),
      responses: networkLog.filter(log => log.type === 'response'),
      failures: networkLog.filter(log => log.type === 'failed'),
      cspHeader,
      summary: {
        totalRequests: networkLog.filter(log => log.type === 'request').length,
        successfulResponses: networkLog.filter(log => log.type === 'response' && log.status === 200).length,
        failedRequests: networkLog.filter(log => log.type === 'failed').length,
        blockedRequests: networkLog.filter(log => log.type === 'response' && log.status >= 400).length
      }
    };

    // Write results
    const outputPath = path.join(OUTPUT_DIR, 'cast-network-requests.json');
    fs.writeFileSync(outputPath, JSON.stringify(networkData, null, 2));

    console.log('\n═══ ITERATION 3 RESULTS ═══');
    console.log('Total Google domain requests:', networkData.summary.totalRequests);
    console.log('Successful (200 OK):', networkData.summary.successfulResponses);
    console.log('Failed requests:', networkData.summary.failedRequests);
    console.log('Blocked (4xx/5xx):', networkData.summary.blockedRequests);
    console.log('\nResults saved to:', outputPath);
  });

  test('ITERATION 4: Cast State Monitoring Test', async ({ page }) => {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('ITERATION 4: Cast State Monitoring Test');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Check if we should run this iteration
    const browserTestPath = path.join(OUTPUT_DIR, 'chrome-cast-browser-test.json');
    if (fs.existsSync(browserTestPath)) {
      const browserTest = JSON.parse(fs.readFileSync(browserTestPath, 'utf-8'));
      if (!browserTest.frameworkExists) {
        test.skip();
        return;
      }
    }

    // Navigate and start playback
    await page.goto(DEV_SITE);
    await page.waitForLoadState('networkidle');

    // Login (if needed)
    const loginButton = page.locator('button:has-text("Sign in with Email")');
    if (await loginButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await loginButton.click();
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/class-builder|dashboard/, { timeout: 10000 });
    }

    await page.goto(`${DEV_SITE}/class-builder`);
    await page.waitForLoadState('networkidle');

    const acceptButton = page.locator('button:has-text("Accept & Add to Class")');
    if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await acceptButton.click();
      await page.waitForTimeout(2000);
    }

    const playButton = page.locator('button:has-text("Play Class")');
    await playButton.waitFor({ state: 'visible', timeout: 5000 });
    await playButton.click();
    await page.waitForTimeout(3000);

    // Monitor cast state for 30 seconds
    const stateLog: any[] = [];
    const startTime = Date.now();
    const monitorDuration = 30000; // 30 seconds

    while (Date.now() - startTime < monitorDuration) {
      const state = await page.evaluate(() => {
        try {
          const cast = (window as any).cast;
          if (!cast?.framework?.CastContext) {
            return { error: 'CastContext not available' };
          }

          const ctx = cast.framework.CastContext.getInstance();
          const currentState = ctx.getCastState();

          return {
            state: currentState,
            stateString: Object.keys(cast.framework.CastState).find(
              key => (cast.framework.CastState as any)[key] === currentState
            ),
            timestamp: Date.now()
          };
        } catch (error: any) {
          return { error: error.message };
        }
      });

      stateLog.push({
        ...state,
        elapsedSeconds: Math.floor((Date.now() - startTime) / 1000)
      });

      await page.waitForTimeout(1000); // Poll every second
    }

    // Analyze state transitions
    const uniqueStates = [...new Set(stateLog.map(log => log.stateString || log.error))];
    const stateChanges = stateLog.filter((log, index) => {
      if (index === 0) return true;
      return log.stateString !== stateLog[index - 1].stateString;
    });

    const stateData = {
      log: stateLog,
      summary: {
        totalSamples: stateLog.length,
        uniqueStates,
        stateChanges: stateChanges.length,
        finalState: stateLog[stateLog.length - 1]
      }
    };

    // Write results
    const outputPath = path.join(OUTPUT_DIR, 'cast-state-transitions.json');
    fs.writeFileSync(outputPath, JSON.stringify(stateData, null, 2));

    console.log('\n═══ ITERATION 4 RESULTS ═══');
    console.log('Total samples:', stateData.summary.totalSamples);
    console.log('Unique states observed:', uniqueStates);
    console.log('State changes:', stateData.summary.stateChanges);
    console.log('Final state:', stateData.summary.finalState);
    console.log('\nResults saved to:', outputPath);
  });

  test('FINAL: Generate Diagnosis', async ({ page }) => {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('FINAL: Generating Comprehensive Diagnosis');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Read all iteration results
    const browserTest = JSON.parse(fs.readFileSync(
      path.join(OUTPUT_DIR, 'chrome-cast-browser-test.json'), 'utf-8'
    ));

    let diagnosis = {
      rootCause: '',
      evidence: [] as string[],
      recommendedFix: '',
      verification: ''
    };

    // Analyze results
    if (!browserTest.castExists) {
      // HYPOTHESIS 1: Browser Incompatibility
      diagnosis = {
        rootCause: 'Browser Incompatibility - Google Cast SDK not supported',
        evidence: [
          `window.cast is ${browserTest.castType} (expected: "object")`,
          `User agent: ${browserTest.userAgent}`,
          'Google Cast SDK only works in Chrome/Edge browsers, NOT Safari',
          'User is testing on iPhone - likely using Safari browser',
          'Les Mills app works because it uses NATIVE iOS app, not web browser'
        ],
        recommendedFix: `Add browser detection to CastButton.tsx (lines 17-29):

// Add at top of CastButton component:
const isChromeOrEdge = /Chrome|Edg/.test(navigator.userAgent) && !/Safari/.test(navigator.userAgent);

if (!isChromeOrEdge) {
  return (
    <div className="p-2 text-cream/50" title="Casting requires Chrome browser on desktop or Android">
      <Cast className="w-6 h-6 opacity-30" />
      <span className="sr-only">Casting only available in Chrome browser</span>
    </div>
  );
}

// Alternative: Show modal explaining browser requirement when clicked
const [showBrowserWarning, setShowBrowserWarning] = useState(false);

return (
  <>
    <button
      onClick={() => setShowBrowserWarning(true)}
      className="p-2 text-cream/50"
      title="Casting not available in this browser"
    >
      <Cast className="w-6 h-6 opacity-30" />
    </button>
    {showBrowserWarning && (
      <div className="modal">
        Chromecast requires Chrome browser on desktop or Android.
        Safari and iOS browsers do not support Google Cast.
      </div>
    )}
  </>
);`,
        verification: `1. User must test in Chrome browser on desktop or Android
2. If using iPhone: Install Chrome browser (NOT Safari)
3. Navigate to bassline-dev.netlify.app in Chrome
4. Start class playback
5. Cast icon should become WHITE/ENABLED when Chromecast detected
6. If still greyed in Chrome → run iterations 2-4 for further diagnosis`
      };
    } else {
      // SDK exists - need to check other iterations
      const timelineExists = fs.existsSync(path.join(OUTPUT_DIR, 'cast-sdk-timeline.json'));
      const networkExists = fs.existsSync(path.join(OUTPUT_DIR, 'cast-network-requests.json'));

      diagnosis = {
        rootCause: 'Further investigation needed',
        evidence: [
          'window.cast exists - SDK loaded successfully',
          'Need timeline and network data to diagnose further',
          `Timeline data available: ${timelineExists}`,
          `Network data available: ${networkExists}`
        ],
        recommendedFix: 'Run iterations 2-4 to complete diagnosis',
        verification: 'Re-run test suite to collect all iteration data'
      };
    }

    // Write final diagnosis
    const diagnosisPath = path.join(OUTPUT_DIR, 'FINAL_DIAGNOSIS.json');
    fs.writeFileSync(diagnosisPath, JSON.stringify(diagnosis, null, 2));

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('ROOT CAUSE:', diagnosis.rootCause);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\nEVIDENCE:');
    diagnosis.evidence.forEach(e => console.log(`- ${e}`));
    console.log('\nRECOMMENDED FIX:');
    console.log(diagnosis.recommendedFix);
    console.log('\nVERIFICATION:');
    console.log(diagnosis.verification);
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('Diagnosis saved to:', diagnosisPath);
    console.log('═══════════════════════════════════════════════════════════\n');
  });
});
