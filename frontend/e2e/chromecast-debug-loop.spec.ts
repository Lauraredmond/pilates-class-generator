import { test, expect } from '@playwright/test';

/**
 * Chromecast Debug Loop - Automated diagnosis and verification
 *
 * This test will:
 * 1. Check if Cast SDK script loads
 * 2. Check if CastButton component renders
 * 3. Verify button state (grey vs white/active)
 * 4. Capture all console logs and errors
 * 5. Provide actionable diagnostics
 */

test.describe('Chromecast Debug Loop', () => {
  test('Diagnose Cast button state and SDK loading', async ({ page }) => {
    console.log('\n🔍 CHROMECAST DIAGNOSTIC TEST STARTING...\n');

    // Capture all console logs
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

    // Capture network errors
    const networkErrors: string[] = [];
    page.on('requestfailed', request => {
      const error = `${request.url()} - ${request.failure()?.errorText}`;
      networkErrors.push(error);

      if (request.url().includes('gstatic.com/cv/js/sender')) {
        console.log(`❌ CRITICAL: Cast SDK script failed to load: ${error}`);
      }
    });

    console.log('📍 Step 1: Navigate to login page');
    await page.goto('https://bassline-dev.netlify.app/login');
    await page.waitForLoadState('networkidle');

    console.log('📍 Step 2: Login');
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(process.env.TEST_USER_EMAIL || '');

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill(process.env.TEST_USER_PASSWORD || '');

    const loginButton = page.locator('button:has-text("Sign In")');
    await loginButton.click();

    await page.waitForURL(/\/classes/);
    console.log('✅ Logged in successfully');

    console.log('📍 Step 3: Navigate to class playback');
    await page.goto('https://bassline-dev.netlify.app/class-builder');
    await page.waitForLoadState('networkidle');

    // Generate a quick class
    const difficultySelect = page.locator('select').first();
    await difficultySelect.selectOption('Beginner');

    const generateButton = page.locator('button:has-text("Generate")');
    await generateButton.click();

    // Wait for generation
    await page.waitForTimeout(5000);

    // Accept class
    const acceptButton = page.locator('button:has-text("Accept")');
    if (await acceptButton.isVisible({ timeout: 2000 })) {
      await acceptButton.click();
    }

    // Click Play Class
    const playButton = page.locator('button:has-text("Play Class")').first();
    await playButton.click({ timeout: 10000 });

    await page.waitForURL(/\/class-builder\/*/);
    console.log('✅ Class playback started');

    console.log('\n📍 Step 4: CHECK CAST SDK SCRIPT LOADING\n');

    const castSDKScriptExists = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts.some(s => s.src.includes('gstatic.com/cv/js/sender'));
    });

    console.log(`Cast SDK script tag exists: ${castSDKScriptExists ? '✅' : '❌'}`);

    const windowCastState = await page.evaluate(() => {
      return {
        exists: !!(window as any).cast,
        framework: !!(window as any).cast?.framework,
        CastContext: !!(window as any).cast?.framework?.CastContext,
        AutoJoinPolicy: !!(window as any).cast?.framework?.AutoJoinPolicy,
        ORIGIN_SCOPED: !!(window as any).cast?.framework?.AutoJoinPolicy?.ORIGIN_SCOPED,
      };
    });

    console.log('\n📊 window.cast state:');
    console.log(`  window.cast: ${windowCastState.exists ? '✅' : '❌'}`);
    console.log(`  cast.framework: ${windowCastState.framework ? '✅' : '❌'}`);
    console.log(`  CastContext: ${windowCastState.CastContext ? '✅' : '❌'}`);
    console.log(`  AutoJoinPolicy: ${windowCastState.AutoJoinPolicy ? '✅' : '❌'}`);
    console.log(`  ORIGIN_SCOPED: ${windowCastState.ORIGIN_SCOPED ? '✅' : '❌'}`);

    console.log('\n📍 Step 5: CHECK CAST BUTTON STATE\n');

    // Wait for CastButton to appear
    await page.waitForTimeout(2000);

    const castButton = page.locator('button[aria-label*="Cast"]');
    const castButtonExists = await castButton.count() > 0;

    console.log(`CastButton component rendered: ${castButtonExists ? '✅' : '❌'}`);

    if (castButtonExists) {
      const buttonState = await castButton.evaluate((btn) => {
        const computedStyle = window.getComputedStyle(btn);
        return {
          ariaLabel: btn.getAttribute('aria-label'),
          disabled: btn.hasAttribute('disabled'),
          className: btn.className,
          color: computedStyle.color,
          backgroundColor: computedStyle.backgroundColor,
          opacity: computedStyle.opacity,
          cursor: computedStyle.cursor,
        };
      });

      console.log('\n🎨 Button Visual State:');
      console.log(`  aria-label: ${buttonState.ariaLabel}`);
      console.log(`  disabled: ${buttonState.disabled}`);
      console.log(`  cursor: ${buttonState.cursor}`);
      console.log(`  color: ${buttonState.color}`);
      console.log(`  backgroundColor: ${buttonState.backgroundColor}`);

      // Check if button is "active" (white) or "greyed out"
      const isGreyedOut = buttonState.cursor === 'not-allowed' ||
                          buttonState.ariaLabel?.includes('No Cast devices') ||
                          buttonState.disabled;

      console.log(`\n🎯 Button State: ${isGreyedOut ? '❌ GREYED OUT (disabled)' : '✅ ACTIVE (can click)'}`);

      // Take screenshot
      await page.screenshot({
        path: 'frontend/screenshots/cast-button-state.png',
        fullPage: false
      });
      console.log('📸 Screenshot saved: screenshots/cast-button-state.png');
    }

    console.log('\n📍 Step 6: ANALYZE CONSOLE LOGS\n');

    const castLogs = consoleLogs.filter(log => log.toLowerCase().includes('cast'));

    console.log(`Total console logs: ${consoleLogs.length}`);
    console.log(`Cast-related logs: ${castLogs.length}`);
    console.log(`Errors: ${consoleErrors.length}`);
    console.log(`Network errors: ${networkErrors.length}`);

    if (castLogs.length > 0) {
      console.log('\n📋 Cast-related console logs:');
      castLogs.forEach(log => console.log(`  ${log}`));
    } else {
      console.log('\n⚠️  NO Cast-related console logs found!');
      console.log('This suggests CastButton component may not be rendering.');
    }

    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors:');
      consoleErrors.slice(0, 10).forEach(err => console.log(`  ${err}`));
    }

    if (networkErrors.length > 0) {
      console.log('\n🌐 Network Errors:');
      networkErrors.forEach(err => console.log(`  ${err}`));
    }

    console.log('\n📍 Step 7: DIAGNOSTIC SUMMARY\n');

    const diagnostics = {
      castSDKScript: castSDKScriptExists,
      windowCast: windowCastState.exists,
      framework: windowCastState.framework,
      castContext: windowCastState.CastContext,
      autoJoinPolicy: windowCastState.AutoJoinPolicy,
      originScoped: windowCastState.ORIGIN_SCOPED,
      buttonRendered: castButtonExists,
      castLogs: castLogs.length,
    };

    console.log('Diagnostics:', JSON.stringify(diagnostics, null, 2));

    // Determine root cause
    if (!castSDKScriptExists) {
      console.log('\n❌ ROOT CAUSE: Cast SDK script tag missing from HTML');
      throw new Error('Cast SDK script tag not found in page');
    }

    if (!windowCastState.exists) {
      console.log('\n❌ ROOT CAUSE: window.cast undefined - SDK script not loading or blocked');
      console.log('Check network tab for gstatic.com/cv/js/sender script loading failures');
      throw new Error('Cast SDK script not loading - window.cast undefined');
    }

    if (!windowCastState.framework) {
      console.log('\n❌ ROOT CAUSE: cast.framework undefined - SDK partially loaded');
      throw new Error('Cast SDK partially loaded - framework missing');
    }

    if (!windowCastState.ORIGIN_SCOPED) {
      console.log('\n❌ ROOT CAUSE: AutoJoinPolicy.ORIGIN_SCOPED undefined');
      throw new Error('Cast SDK missing ORIGIN_SCOPED property');
    }

    if (!castButtonExists) {
      console.log('\n❌ ROOT CAUSE: CastButton component not rendering');
      throw new Error('CastButton component not found in DOM');
    }

    if (castLogs.length === 0) {
      console.log('\n⚠️  WARNING: CastButton rendered but no logs - component may not be initializing');
    }

    console.log('\n✅ All checks passed - issue is device-specific (no Chromecast on network)');
  });
});
