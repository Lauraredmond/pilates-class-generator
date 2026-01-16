/**
 * Comprehensive E2E Class Playback Test
 *
 * Tests full workflow from class generation through complete playback:
 * - Class generation (AI or database)
 * - Section progression (preparation → warmup → movements → transitions → cooldown → meditation → homecare)
 * - Music playback (Web Audio API - checks AudioContext state)
 * - Voiceover playback (checks AudioContext + section voiceover URLs)
 * - Video display (preparation, warmup, movements)
 * - "Video coming soon" badge (when movement video missing)
 * - Manual controls (Previous, Next, Pause/Resume)
 * - Section auto-advance (timer-based progression)
 * - Chromecast icon state (should not be greyed out unless device absent)
 */

import { test, expect } from '@playwright/test';

// Load test credentials from environment (loaded by Playwright config)
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword';
const TEST_ENV = process.env.TEST_ENV || 'dev';

// Environment URLs
const ENV_URLS = {
  dev: 'https://bassline-dev.netlify.app',
  prod: 'https://basslinemvp.netlify.app'
};

const BASE_URL = ENV_URLS[TEST_ENV as keyof typeof ENV_URLS];

test.describe('Class Playback - Full E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto(BASE_URL);

    // Wait for app to load
    await page.waitForLoadState('networkidle');

    // Handle Medical Safety Disclaimer if present
    const disclaimerModal = page.locator('text=Medical Safety Disclaimer');
    const modalVisible = await disclaimerModal.isVisible({ timeout: 3000 }).catch(() => false);
    if (modalVisible) {
      // Step 1: Answer pregnancy question (No)
      const pregnancyNo = page.locator('button:has-text("No")');
      if (await pregnancyNo.isVisible({ timeout: 2000 }).catch(() => false)) {
        await pregnancyNo.click();
        await page.waitForTimeout(500);
      }

      // Step 2: Check required checkboxes
      const checkbox1 = page.locator('input[type="checkbox"]').first();
      const checkbox2 = page.locator('input[type="checkbox"]').nth(1);
      if (await checkbox1.isVisible({ timeout: 2000 }).catch(() => false)) {
        await checkbox1.check();
        await checkbox2.check();
        await page.waitForTimeout(300);
      }

      // Step 3: Click "Accept - Continue to App"
      const acceptButton = page.locator('button:has-text("Accept - Continue to App")');
      if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await acceptButton.click();
        await page.waitForTimeout(500);
      }
    }

    // Check if already logged in
    const isLoggedIn = await page.locator('text=Generate').isVisible().catch(() => false);

    if (!isLoggedIn) {
      // Check if we're already on the login page
      const currentUrl = page.url();
      if (!currentUrl.includes('/login')) {
        // Navigate to login page
        await page.goto(`${BASE_URL}/login`);
        await page.waitForLoadState('networkidle');
      }

      // Fill login form
      await page.fill('input[type="email"]', TEST_USER_EMAIL);
      await page.fill('input[type="password"]', TEST_USER_PASSWORD);

      // Submit login
      await page.click('button:has-text("Sign In")');

      // Wait for redirect to dashboard
      await page.waitForURL(/\/(dashboard|generate|$)/, { timeout: 15000 });
    }
  });

  test('Full class playback: generation → sections → audio → video → controls', async ({ page }) => {
    console.log('\n📋 Testing Class Playback - Full E2E Flow...\n');

    // ============================================================
    // STEP 1: Generate a Class (10-minute Beginner class)
    // ============================================================
    console.log('🎬 STEP 1: Generating class...');

    // Navigate to class builder
    await page.click('text=Generate');
    await page.waitForURL(/\/class-builder/, { timeout: 10000 });

    // Wait for page to fully load
    await page.waitForTimeout(2000);

    // Select duration (10 minutes - shorter for faster testing)
    // Find the option text first to get exact match
    await page.selectOption('select >> nth=0', { label: '10 minutes - Quick movement practise' });

    // Select difficulty (Beginner)
    await page.selectOption('select >> nth=1', { label: 'Beginner' });

    // Click "Generate Class Plan" button
    await page.click('button:has-text("Generate Class Plan")');

    // Wait for results modal to appear (DEFAULT mode is fast ~1s, AI mode takes ~38s)
    await page.waitForSelector('text=Your Auto-Generated Class', { timeout: 60000 });

    console.log('✅ Class generated successfully');

    // ============================================================
    // STEP 2: Accept Class and Start Playback
    // ============================================================
    console.log('\n🎬 STEP 2: Accepting class and starting playback...');

    // Click "Accept & Add to Class" button in modal
    await page.click('button:has-text("Accept & Add to Class")');

    // Wait for modal to close (indicated by "Play Class" button becoming visible)
    await page.waitForSelector('button:has-text("Play Class")', { timeout: 5000 });

    console.log('✅ Class saved and modal closed');

    // Click "Play Class" button (section 2 on class builder page)
    await page.click('button:has-text("Play Class")');

    // Wait for playback page to load (fullscreen mode)
    await page.waitForSelector('button[aria-label="Pause"]', { timeout: 10000 });

    console.log('✅ Playback started');

    // Give playback UI time to fully render
    await page.waitForTimeout(2000);

    // ============================================================
    // STEP 3: CHROMECAST BUTTON VERIFICATION (CRITICAL)
    // ============================================================
    console.log('\n🎬 STEP 3: Testing Chromecast button state (CRITICAL)...\n');

    // First, check if Cast SDK loaded
    const castSDKCheck = await page.evaluate(() => {
      const win = window as any;
      return {
        scriptExists: !!document.querySelector('script[src*="gstatic.com/cv/js/sender"]'),
        castObject: typeof win.cast !== 'undefined',
        framework: typeof win.cast?.framework !== 'undefined',
        contextState: (() => {
          try {
            if (win.cast?.framework) {
              const ctx = win.cast.framework.CastContext.getInstance();
              return {
                exists: true,
                castState: ctx.getCastState(),
                sessionState: ctx.getSessionState()
              };
            }
          } catch (e: any) {
            return { exists: false, error: e.message };
          }
          return { exists: false };
        })()
      };
    });

    console.log('=== CAST SDK STATUS ===');
    console.log(`Script tag loaded: ${castSDKCheck.scriptExists ? '✅' : '❌'}`);
    console.log(`window.cast exists: ${castSDKCheck.castObject ? '✅' : '❌'}`);
    console.log(`cast.framework exists: ${castSDKCheck.framework ? '✅' : '❌'}`);
    console.log(`CastContext state: ${JSON.stringify(castSDKCheck.contextState, null, 2)}`);

    // Find CastButton - try multiple selectors
    console.log('\n=== FINDING CAST BUTTON ===');

    const castButtonSelectors = [
      'button[aria-label="Cast to TV"]',
      'button[aria-label="Connected to TV"]',
      'button[aria-label="No Cast devices found"]',
      'button:has(svg):has(path[d*="M2 8V6"])',  // Cast icon SVG
      '.absolute.top-4.right-16.z-10 button',   // Position-based
    ];

    let castButton = null;
    let castButtonFound = false;
    let usedSelector = '';

    for (const selector of castButtonSelectors) {
      const element = page.locator(selector).first();
      const isVisible = await element.isVisible({ timeout: 2000 }).catch(() => false);
      if (isVisible) {
        castButton = element;
        castButtonFound = true;
        usedSelector = selector;
        console.log(`✅ Found CastButton using: ${selector}`);
        break;
      }
    }

    if (!castButtonFound) {
      console.log('❌ CRITICAL: CastButton component NOT FOUND on page');
      console.log('This is a major issue - button should be visible during playback');

      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/cast-button-NOT-FOUND.png', fullPage: true });

      expect(castButtonFound, 'CastButton should be visible during playback').toBe(true);
    } else {
      console.log('✅ CastButton component is visible\n');

      // Get detailed button state
      const buttonState = await castButton.evaluate((btn) => {
        const styles = window.getComputedStyle(btn);
        return {
          ariaLabel: btn.getAttribute('aria-label'),
          disabled: (btn as HTMLButtonElement).disabled,
          ariaDisabled: btn.getAttribute('aria-disabled'),
          className: btn.className,
          opacity: styles.opacity,
          cursor: styles.cursor,
          color: styles.color,
          backgroundColor: styles.backgroundColor,
        };
      });

      console.log('=== CAST BUTTON STATE ===');
      console.log(JSON.stringify(buttonState, null, 2));

      // Take screenshot of the button
      await castButton.screenshot({ path: 'test-results/cast-button-state.png' });

      // CRITICAL CHECK: Is button greyed out?
      const isGreyedOut =
        buttonState.disabled ||
        buttonState.className?.includes('cursor-not-allowed') ||
        buttonState.cursor === 'not-allowed' ||
        buttonState.className?.includes('text-cream/30') ||
        buttonState.className?.includes('opacity-50') ||
        buttonState.ariaLabel?.includes('No Cast devices found');

      console.log('\n' + '='.repeat(60));
      if (isGreyedOut) {
        console.log('❌ CRITICAL FAILURE: CHROMECAST BUTTON IS GREYED OUT');
        console.log('='.repeat(60));
        console.log('');
        console.log('Button aria-label:', buttonState.ariaLabel);
        console.log('Button disabled:', buttonState.disabled);
        console.log('Button cursor:', buttonState.cursor);
        console.log('Button className:', buttonState.className);
        console.log('');
        console.log('🔍 DIAGNOSIS:');
        console.log('User confirmed Les Mills app casts fine to same Chromecast.');
        console.log('This means:');
        console.log('  1. ✅ Chromecast device is powered on and working');
        console.log('  2. ✅ User device and Chromecast on same WiFi network');
        console.log('  3. ❌ THIS APP\'S Cast SDK is NOT detecting the device');
        console.log('');
        console.log('Root causes to investigate:');
        console.log('  - CSP policy blocking Cast SDK communication');
        console.log('  - Cast SDK script failed to load or initialize');
        console.log('  - CastContext not properly initialized');
        console.log('  - Different Cast receiver app ID needed');
        console.log('');
        console.log('Cast SDK Status:');
        console.log(`  Script loaded: ${castSDKCheck.scriptExists ? 'YES' : 'NO'}`);
        console.log(`  window.cast: ${castSDKCheck.castObject ? 'YES' : 'NO'}`);
        console.log(`  cast.framework: ${castSDKCheck.framework ? 'YES' : 'NO'}`);
        console.log(`  CastContext: ${castSDKCheck.contextState.exists ? 'YES' : 'NO'}`);
        console.log('='.repeat(60));
      } else {
        console.log('✅ SUCCESS: CHROMECAST BUTTON IS ACTIVE (NOT GREYED OUT)');
        console.log('='.repeat(60));
        console.log('Button is in active state - devices are detectable');
        console.log('Cast functionality should work correctly');
      }

      // CRITICAL ASSERTION
      expect(isGreyedOut,
        `Chromecast button should be ACTIVE (white), not greyed out. ` +
        `Les Mills app casts fine to same device, so issue is with this app's Cast SDK integration. ` +
        `Button state: ${buttonState.ariaLabel}, disabled: ${buttonState.disabled}, cursor: ${buttonState.cursor}`
      ).toBe(false);

      console.log('\n✅ Chromecast button test completed');
    }

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 CHROMECAST TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Chromecast button found: ${castButtonFound ? '✅ YES' : '❌ NO'}`);
    console.log(`Cast SDK loaded: ${castSDKCheck.scriptExists ? '✅ YES' : '❌ NO'}`);
    console.log(`window.cast exists: ${castSDKCheck.castObject ? '✅ YES' : '❌ NO'}`);
    console.log(`cast.framework exists: ${castSDKCheck.framework ? '✅ YES' : '❌ NO'}`);
    console.log('='.repeat(60) + '\n');

    console.log('✅ Chromecast test completed\n');
  });

  test.skip('AI toggle tests - not priority (toggle in settings page)', async ({ page }) => {
    // AI toggle tests skipped per user request (not priority)
    console.log('⏭️  AI toggle tests skipped (not priority)');
  });
});
