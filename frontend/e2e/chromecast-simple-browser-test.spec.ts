/**
 * Simplified Chromecast Browser Test
 * Tests Cast SDK availability without requiring full class generation workflow
 */

import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = '/tmp/chromecast-investigation';

test.beforeAll(() => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
});

test('Cast SDK Browser Compatibility Test', async ({ page, browserName }) => {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('Chromecast Browser Compatibility Test');
  console.log(`Testing with: ${browserName}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // Navigate to dev site
  await page.goto('https://bassline-dev.netlify.app');
  await page.waitForLoadState('networkidle');

  // Wait a few seconds for Cast SDK to load (if it will)
  await page.waitForTimeout(5000);

  // Execute browser detection
  const results = await page.evaluate(() => {
    const cast = (window as any).cast;

    return {
      // Browser info
      userAgent: navigator.userAgent,
      browserVendor: navigator.vendor,
      platform: navigator.platform,

      // Cast SDK detection
      castExists: typeof cast !== 'undefined',
      castType: typeof cast,
      castKeys: cast ? Object.keys(cast) : [],

      // Framework detection
      frameworkExists: typeof cast?.framework !== 'undefined',
      frameworkType: typeof cast?.framework,
      frameworkKeys: cast?.framework ? Object.keys(cast.framework) : [],

      // Specific checks
      castContextExists: typeof cast?.framework?.CastContext !== 'undefined',
      autoJoinPolicyExists: typeof cast?.framework?.AutoJoinPolicy !== 'undefined',
      originScopedValue: cast?.framework?.AutoJoinPolicy?.ORIGIN_SCOPED,

      // Script tag verification
      scriptTagExists: !!document.querySelector('script[src*="gstatic.com/cv/js/sender"]'),
      scriptSrc: document.querySelector('script[src*="gstatic.com/cv/js/sender"]')?.getAttribute('src'),

      // Timestamp
      timestamp: new Date().toISOString(),
      performanceNow: performance.now()
    };
  });

  // Determine browser type from user agent
  const isSafari = /Safari/.test(results.userAgent) && !/Chrome/.test(results.userAgent);
  const isChrome = /Chrome/.test(results.userAgent);
  const isEdge = /Edg/.test(results.userAgent);

  const analysis = {
    ...results,
    detectedBrowser: isSafari ? 'Safari' : isChrome ? 'Chrome' : isEdge ? 'Edge' : 'Unknown',
    isCastSupported: isChrome || isEdge,
    diagnosis: ''
  };

  // Generate diagnosis
  if (!results.scriptTagExists) {
    analysis.diagnosis = 'CRITICAL: Cast SDK script tag not found in HTML - SDK not loaded at all';
  } else if (!results.castExists) {
    analysis.diagnosis = `CONFIRMED: Browser incompatibility - ${analysis.detectedBrowser} does NOT support Google Cast API. window.cast is undefined despite script tag being present. This is EXPECTED for Safari/WebKit browsers.`;
  } else if (!results.frameworkExists) {
    analysis.diagnosis = 'SDK loaded but framework not initialized - possible timing or initialization issue';
  } else if (!results.castContextExists) {
    analysis.diagnosis = 'Framework loaded but CastContext missing - SDK initialization incomplete';
  } else {
    analysis.diagnosis = 'SDK fully loaded and initialized - device discovery should work if Chromecast on network';
  }

  // Write results
  const outputPath = path.join(OUTPUT_DIR, 'chrome-cast-browser-test.json');
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));

  // Log results to console
  console.log('\n═══ BROWSER DETECTION RESULTS ═══');
  console.log('Browser:', analysis.detectedBrowser);
  console.log('User Agent:', results.userAgent.substring(0, 100) + '...');
  console.log('\n═══ CAST SDK STATUS ═══');
  console.log('Script tag exists:', results.scriptTagExists ? '✅' : '❌');
  console.log('window.cast exists:', results.castExists ? '✅' : '❌');
  console.log('typeof window.cast:', results.castType);
  console.log('window.cast.framework exists:', results.frameworkExists ? '✅' : '❌');
  console.log('CastContext exists:', results.castContextExists ? '✅' : '❌');
  console.log('AutoJoinPolicy exists:', results.autoJoinPolicyExists ? '✅' : '❌');
  console.log('\n═══ DIAGNOSIS ═══');
  console.log(analysis.diagnosis);
  console.log('\n═══ RECOMMENDED ACTION ═══');

  if (!results.castExists && isSafari) {
    console.log(`
❌ ROOT CAUSE IDENTIFIED: Safari Browser Incompatibility

Google Cast SDK does NOT work in Safari or WebKit-based browsers.
The SDK script loads successfully but window.cast remains undefined.

USER IS TESTING ON IPHONE:
- iPhone defaults to Safari browser
- Safari does NOT support Google Cast API
- This is why Les Mills works (native iOS app) but web app doesn't

SOLUTION:
1. Inform user to test in Chrome browser on desktop or Android
2. Add browser detection UI to warn Safari users
3. Consider native iOS app for iPhone casting support

VERIFICATION:
User must:
- Install Chrome browser on iPhone (if testing mobile)
- OR test on desktop Chrome/Edge browser
- OR accept that casting won't work in Safari
`);
  } else if (results.castExists) {
    console.log(`
✅ SDK LOADED SUCCESSFULLY

Browser supports Cast API. If icon still greyed out:
- Check network requests for device discovery attempts
- Monitor cast state transitions
- Verify CSP not blocking Google domain connections
- Confirm Chromecast on same network as testing device
`);
  }

  console.log('\nResults saved to:', outputPath);
  console.log('═══════════════════════════════════════════════════════════\n');
});
