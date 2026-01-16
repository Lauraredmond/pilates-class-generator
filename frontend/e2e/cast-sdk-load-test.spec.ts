import { test, expect } from '@playwright/test';

/**
 * Simple Cast SDK Load Test - No Login Required
 *
 * This test verifies that the Google Cast SDK script loads successfully
 * after the CSP fix. It doesn't require authentication.
 */

test.describe('Cast SDK Loading Test (No Auth)', () => {
  test('Verify Cast SDK loads from gstatic.com with new CSP', async ({ page }) => {
    console.log('\n🔍 CAST SDK LOADING TEST STARTING...\n');

    // Capture console logs
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type()}] ${text}`);

      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }

      // Log Cast-related messages immediately
      if (text.toLowerCase().includes('cast')) {
        console.log(`📢 Cast-related: [${msg.type()}] ${text}`);
      }
    });

    // Capture network requests
    const networkRequests: string[] = [];
    const networkErrors: string[] = [];

    page.on('request', request => {
      const url = request.url();
      if (url.includes('gstatic.com')) {
        networkRequests.push(url);
        console.log(`📡 Network Request: ${url}`);
      }
    });

    page.on('requestfailed', request => {
      const url = request.url();
      const error = `${url} - ${request.failure()?.errorText}`;
      networkErrors.push(error);

      if (url.includes('gstatic.com')) {
        console.log(`❌ NETWORK ERROR: ${error}`);
      }
    });

    console.log('📍 Step 1: Navigate to dev homepage');
    await page.goto('https://bassline-dev.netlify.app/');
    await page.waitForLoadState('networkidle');

    // Wait for __onGCastApiAvailable callback or timeout
    const callbackFired = await page.evaluate(() => {
      return new Promise((resolve) => {
        let called = false;
        const originalCallback = (window as any).__onGCastApiAvailable;

        (window as any).__onGCastApiAvailable = (isAvailable: boolean) => {
          called = true;
          console.log(`✅ __onGCastApiAvailable callback fired: ${isAvailable}`);
          if (originalCallback) {
            originalCallback(isAvailable);
          }
          resolve(isAvailable);
        };

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!called) {
            console.log('⏰ __onGCastApiAvailable callback did not fire after 10 seconds');
            resolve(false);
          }
        }, 10000);
      });
    });

    console.log(`Callback fired: ${callbackFired ? '✅' : '❌'}`);

    console.log('\n📍 Step 2: CHECK CAST SDK SCRIPT TAG\n');

    const castSDKScriptExists = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts.some(s => s.src.includes('gstatic.com/cv/js/sender'));
    });

    console.log(`Cast SDK script tag exists: ${castSDKScriptExists ? '✅' : '❌'}`);

    console.log('\n📍 Step 3: CHECK WINDOW.CAST STATE\n');

    const windowCastState = await page.evaluate(() => {
      return {
        exists: !!(window as any).cast,
        type: typeof (window as any).cast,
        framework: !!(window as any).cast?.framework,
        CastContext: !!(window as any).cast?.framework?.CastContext,
        AutoJoinPolicy: !!(window as any).cast?.framework?.AutoJoinPolicy,
        ORIGIN_SCOPED: !!(window as any).cast?.framework?.AutoJoinPolicy?.ORIGIN_SCOPED,
        fullObject: (window as any).cast ? JSON.stringify(Object.keys((window as any).cast)) : null,
      };
    });

    console.log('\n📊 window.cast state:');
    console.log(`  window.cast exists: ${windowCastState.exists ? '✅' : '❌'}`);
    console.log(`  typeof window.cast: ${windowCastState.type}`);
    console.log(`  cast.framework: ${windowCastState.framework ? '✅' : '❌'}`);
    console.log(`  CastContext: ${windowCastState.CastContext ? '✅' : '❌'}`);
    console.log(`  AutoJoinPolicy: ${windowCastState.AutoJoinPolicy ? '✅' : '❌'}`);
    console.log(`  ORIGIN_SCOPED: ${windowCastState.ORIGIN_SCOPED ? '✅' : '❌'}`);
    if (windowCastState.fullObject) {
      console.log(`  window.cast keys: ${windowCastState.fullObject}`);
    }

    console.log('\n📍 Step 4: CHECK NETWORK REQUESTS\n');

    console.log(`Network requests to gstatic.com: ${networkRequests.length}`);
    networkRequests.forEach(url => console.log(`  ✅ ${url}`));

    console.log(`\nNetwork errors: ${networkErrors.length}`);
    if (networkErrors.length > 0) {
      networkErrors.forEach(err => console.log(`  ❌ ${err}`));
    }

    console.log('\n📍 Step 5: CHECK CONSOLE ERRORS\n');

    const cspErrors = consoleErrors.filter(err =>
      err.includes('Content Security Policy') ||
      err.includes('CSP') ||
      err.includes('Refused to')
    );

    console.log(`CSP-related errors: ${cspErrors.length}`);
    if (cspErrors.length > 0) {
      cspErrors.forEach(err => console.log(`  ❌ ${err}`));
    }

    console.log('\n📍 Step 6: DIAGNOSTIC SUMMARY\n');

    const diagnostics = {
      castSDKScript: castSDKScriptExists,
      windowCast: windowCastState.exists,
      framework: windowCastState.framework,
      castContext: windowCastState.CastContext,
      autoJoinPolicy: windowCastState.AutoJoinPolicy,
      originScoped: windowCastState.ORIGIN_SCOPED,
      networkRequests: networkRequests.length,
      networkErrors: networkErrors.length,
      cspErrors: cspErrors.length,
    };

    console.log('Diagnostics:', JSON.stringify(diagnostics, null, 2));

    // Determine result
    if (!castSDKScriptExists) {
      console.log('\n❌ FAILURE: Cast SDK script tag missing from HTML');
      throw new Error('Cast SDK script tag not found in page');
    }

    if (networkRequests.length === 0) {
      console.log('\n❌ FAILURE: No network requests to gstatic.com - script not loading');
      throw new Error('Cast SDK script not making network request');
    }

    if (networkErrors.length > 0) {
      console.log('\n❌ FAILURE: Network errors loading Cast SDK');
      throw new Error('Cast SDK script failed to load from network');
    }

    if (cspErrors.length > 0) {
      console.log('\n❌ FAILURE: CSP errors blocking Cast SDK');
      throw new Error('CSP policy still blocking Cast SDK');
    }

    if (!windowCastState.exists) {
      console.log('\n⚠️  WARNING: window.cast undefined - SDK not executing in headless Chrome');
      console.log('This is EXPECTED in headless Chrome (no Cast hardware)');
      console.log('The important thing is CSP is fixed: script loads without errors');
    } else {
      console.log('\n✅ EXCELLENT: window.cast exists in headless Chrome!');
    }

    if (!windowCastState.framework && windowCastState.exists) {
      console.log('\n⚠️  WARNING: cast.framework undefined - SDK partially loaded');
    }

    console.log('\n✅ SUCCESS: Cast SDK script loads successfully with new CSP!');
    console.log('No CSP errors, network requests successful');
    console.log('Script tag exists and downloads from gstatic.com');
    console.log('\n📌 READY FOR USER TESTING ON REAL DEVICE (iPhone with Chromecast)');

    // Pass the test - CSP is fixed even if window.cast undefined
    expect(castSDKScriptExists).toBe(true);
    expect(cspErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
    expect(networkRequests.length).toBeGreaterThan(0);
  });
});
