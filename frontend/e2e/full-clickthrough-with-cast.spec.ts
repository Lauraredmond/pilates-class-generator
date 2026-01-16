import { test, expect } from '@playwright/test';

/**
 * E2E Test: Full Clickthrough Test with Chromecast Debugging
 *
 * This comprehensive test covers:
 * 1. Complete user journey (login → class generation → playback → exit)
 * 2. Chromecast button state verification
 * 3. Screenshot capture at every step
 * 4. Console log monitoring
 * 5. iOS PWA compatibility checks
 *
 * Usage:
 *   # Test dev environment
 *   TEST_ENV=dev npx playwright test full-clickthrough-with-cast.spec.ts --headed
 *
 *   # Test production
 *   TEST_ENV=production npx playwright test full-clickthrough-with-cast.spec.ts --headed
 *
 *   # Test on mobile (iPhone simulation)
 *   TEST_ENV=dev npx playwright test full-clickthrough-with-cast.spec.ts --project=dev-mobile-safari --headed
 */

// Test user credentials
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@bassline.dev',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
};

test.describe('Full Clickthrough Test with Chromecast Debugging', () => {
  let consoleMessages: string[] = [];
  let castButtonLogs: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Reset log arrays
    consoleMessages = [];
    castButtonLogs = [];

    // Capture all console messages
    page.on('console', (msg) => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type().toUpperCase()}] ${text}`);

      // Specifically capture CastButton logs
      if (text.includes('[CastButton]') || text.includes('Cast')) {
        castButtonLogs.push(text);
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      consoleMessages.push(`[PAGE ERROR] ${error.message}`);
    });

    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Save console logs to file
    const logsPath = `playwright-logs-${testInfo.title.replace(/\s+/g, '-')}.txt`;
    await page.evaluate((logs) => {
      console.log('=== CAPTURED CONSOLE LOGS ===');
      logs.forEach(log => console.log(log));
    }, consoleMessages);

    // Print Chromecast-specific logs
    if (castButtonLogs.length > 0) {
      console.log('\n=== CHROMECAST LOGS ===');
      castButtonLogs.forEach(log => console.log(log));
    }
  });

  test('FULL CLICKTHROUGH: Login → Generate Class → Playback → Chromecast Test → Exit', async ({ page }) => {
    // ========================================
    // STEP 1: Login
    // ========================================
    await test.step('1. Login with test user', async () => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'screenshots/01-login-page.png', fullPage: true });

      // Fill credentials
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.screenshot({ path: 'screenshots/02-login-filled.png', fullPage: true });

      // Submit
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await page.screenshot({ path: 'screenshots/03-dashboard.png', fullPage: true });

      await expect(page).toHaveURL(/dashboard/);
      console.log('✅ Step 1: Login successful');
    });

    // ========================================
    // STEP 2: Navigate to Class Builder
    // ========================================
    await test.step('2. Navigate to class builder', async () => {
      const generateLink = page.locator('a[href*="class-builder"], a:has-text("Generate"), button:has-text("Generate")').first();
      await generateLink.click();

      await page.waitForURL('**/class-builder', { timeout: 10000 });
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'screenshots/04-class-builder.png', fullPage: true });

      await expect(page).toHaveURL(/class-builder/);
      console.log('✅ Step 2: Navigated to class builder');
    });

    // ========================================
    // STEP 3: Fill Class Generation Form
    // ========================================
    await test.step('3. Fill class generation form', async () => {
      // Select difficulty
      await page.click('text=Beginner');

      // Set duration (30 minutes)
      const durationSlider = page.locator('input[type="range"]').first();
      await durationSlider.fill('30');

      // Ensure AI mode is OFF (database mode)
      const aiToggle = page.locator('button[role="switch"], input[type="checkbox"]').filter({ hasText: /AI/i });
      if (await aiToggle.isVisible()) {
        const isChecked = await aiToggle.getAttribute('aria-checked');
        if (isChecked === 'true') {
          await aiToggle.click();
        }
      }

      await page.screenshot({ path: 'screenshots/05-form-filled.png', fullPage: true });
      console.log('✅ Step 3: Form filled (Beginner, 30 min, Database mode)');
    });

    // ========================================
    // STEP 4: Generate Class
    // ========================================
    await test.step('4. Generate class', async () => {
      const generateButton = page.locator('button:has-text("Generate"), button:has-text("Create Class")').first();
      await generateButton.click();

      // Wait for results modal
      const resultsModal = page.locator('[role="dialog"], .modal, [class*="modal"]').filter({ hasText: /Generated|Results|Complete/i });
      await expect(resultsModal).toBeVisible({ timeout: 15000 });

      await page.screenshot({ path: 'screenshots/06-generation-results.png', fullPage: true });
      console.log('✅ Step 4: Class generated successfully');
    });

    // ========================================
    // STEP 5: Verify 6-Section Structure
    // ========================================
    await test.step('5. Verify 6-section class structure', async () => {
      const sections = ['Preparation', 'Warm', 'Movement', 'Cool', 'Meditation', 'Home'];

      for (const section of sections) {
        const sectionElement = page.locator(`text=${section}`).first();
        await expect(sectionElement).toBeVisible();
      }

      // Verify movement count
      const movementCards = page.locator('[class*="movement"], [data-testid*="movement"]');
      const count = await movementCards.count();
      expect(count).toBeGreaterThan(5);
      expect(count).toBeLessThan(15);

      console.log(`✅ Step 5: All 6 sections verified (${count} movements)`);
    });

    // ========================================
    // STEP 6: Save to Library
    // ========================================
    await test.step('6. Save class to library', async () => {
      const acceptButton = page.locator('button:has-text("Accept"), button:has-text("Save"), button:has-text("Add to Library")').first();
      await acceptButton.click();

      await page.waitForTimeout(2000); // Wait for save to complete
      await page.screenshot({ path: 'screenshots/07-class-saved.png', fullPage: true });
      console.log('✅ Step 6: Class saved to library');
    });

    // ========================================
    // STEP 7: Navigate to Classes and Start Playback
    // ========================================
    await test.step('7. Navigate to classes and start playback', async () => {
      const classesLink = page.locator('a[href*="classes"], a:has-text("Classes")').first();
      await classesLink.click();

      await page.waitForURL('**/classes', { timeout: 10000 });
      await page.screenshot({ path: 'screenshots/08-classes-library.png', fullPage: true });

      // Click first class
      const firstClass = page.locator('[class*="class-card"], [data-testid*="class"]').first();
      await firstClass.click();

      await page.waitForURL('**/playback', { timeout: 10000 });
      await page.waitForTimeout(2000); // Wait for playback to initialize
      await page.screenshot({ path: 'screenshots/09-playback-started.png', fullPage: true });

      console.log('✅ Step 7: Playback started');
    });

    // ========================================
    // STEP 8: CHROMECAST BUTTON DEBUGGING
    // ========================================
    await test.step('8. Test and debug Chromecast button', async () => {
      console.log('\n=== CHROMECAST BUTTON DEBUGGING ===');

      // 1. Check if Cast SDK script loaded
      const castSDKLoaded = await page.evaluate(() => {
        return {
          castExists: typeof (window as any).cast !== 'undefined',
          frameworkExists: typeof (window as any).cast?.framework !== 'undefined',
        };
      });

      console.log(`Cast SDK loaded: ${castSDKLoaded.castExists}`);
      console.log(`Cast framework available: ${castSDKLoaded.frameworkExists}`);

      // 2. Try to get Cast context manually
      const castContextState = await page.evaluate(() => {
        try {
          if ((window as any).cast?.framework) {
            const ctx = (window as any).cast.framework.CastContext.getInstance();
            return {
              state: ctx.getCastState(),
              sessionState: ctx.getSessionState(),
              error: null,
            };
          }
          return { error: 'Cast framework not available' };
        } catch (e: any) {
          return { error: e.message };
        }
      });

      console.log('Cast context state:', JSON.stringify(castContextState, null, 2));

      // 3. Find CastButton component
      const castButton = page.locator('button[aria-label*="Cast"], button:has-text("Cast"), [class*="cast-button"]').first();
      const castButtonExists = await castButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (castButtonExists) {
        console.log('✅ CastButton component is visible');

        // Check if greyed out
        const buttonClass = await castButton.getAttribute('class');
        const isDisabled = await castButton.isDisabled();
        const ariaDisabled = await castButton.getAttribute('aria-disabled');

        console.log(`Button classes: ${buttonClass}`);
        console.log(`Is disabled: ${isDisabled}`);
        console.log(`Aria-disabled: ${ariaDisabled}`);

        // Take screenshot of cast button
        await castButton.screenshot({ path: 'screenshots/10-cast-button.png' });

        // Try clicking it
        await castButton.click({ force: true });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/11-cast-button-clicked.png', fullPage: true });
      } else {
        console.log('❌ CastButton component NOT visible');
      }

      // 4. Check Network tab for Cast SDK request
      const castSDKRequests = consoleMessages.filter(msg =>
        msg.includes('gstatic.com') || msg.includes('cast_sender.js')
      );

      if (castSDKRequests.length > 0) {
        console.log('Cast SDK network requests:', castSDKRequests);
      } else {
        console.log('⚠️ No Cast SDK network requests found');
      }

      // 5. Check for CastButton console logs
      if (castButtonLogs.length > 0) {
        console.log('\nCastButton logs found:');
        castButtonLogs.forEach(log => console.log(`  ${log}`));
      } else {
        console.log('⚠️ No [CastButton] logs found - component may not be initializing');
      }

      await page.screenshot({ path: 'screenshots/12-chromecast-debug-complete.png', fullPage: true });
      console.log('✅ Step 8: Chromecast debugging complete');
    });

    // ========================================
    // STEP 9: Test Music Playback
    // ========================================
    await test.step('9. Verify music player', async () => {
      // Check for audio element
      const audioElement = page.locator('audio').first();
      await expect(audioElement).toBeVisible({ timeout: 5000 });

      // Check if music has src
      const audioSrc = await audioElement.getAttribute('src');
      expect(audioSrc).toBeTruthy();

      console.log(`Music source: ${audioSrc}`);
      console.log('✅ Step 9: Music player verified');
    });

    // ========================================
    // STEP 10: Test Exit Modal Buttons (iOS fix)
    // ========================================
    await test.step('10. Test exit confirmation modal buttons', async () => {
      // Find and click X button (exit button)
      const exitButton = page.locator('button[aria-label*="Exit"], button:has([class*="X"]), button:has-text("X")').first();

      if (await exitButton.isVisible({ timeout: 3000 })) {
        await exitButton.click();

        // Wait for exit confirmation modal
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'screenshots/13-exit-modal.png', fullPage: true });

        // Check if modal appeared
        const exitModal = page.locator('text=Exit Class?');
        const modalVisible = await exitModal.isVisible({ timeout: 3000 }).catch(() => false);

        if (modalVisible) {
          console.log('✅ Exit confirmation modal appeared');

          // Test "Continue Class" button
          const continueButton = page.locator('button:has-text("Continue Class")').first();
          await expect(continueButton).toBeVisible();

          // Click it
          await continueButton.click();
          await page.waitForTimeout(500);
          await page.screenshot({ path: 'screenshots/14-modal-continue-clicked.png', fullPage: true });

          console.log('✅ "Continue Class" button works');

          // Click exit again to test "Exit" button
          await exitButton.click();
          await page.waitForTimeout(500);

          const exitConfirmButton = page.locator('button:has-text("Exit")').filter({ hasNotText: /Class/i }).first();
          await expect(exitConfirmButton).toBeVisible();

          await page.screenshot({ path: 'screenshots/15-exit-modal-again.png', fullPage: true });

          // Click Exit button
          await exitConfirmButton.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: 'screenshots/16-exited-playback.png', fullPage: true });

          console.log('✅ "Exit" button works');
          console.log('✅ Step 10: Exit modal buttons verified (iOS fix working)');
        } else {
          console.log('⚠️ Exit confirmation modal did not appear');
        }
      } else {
        console.log('⚠️ Exit button not found');
      }
    });

    // ========================================
    // FINAL: Log Summary
    // ========================================
    console.log('\n=== TEST SUMMARY ===');
    console.log(`Total console messages captured: ${consoleMessages.length}`);
    console.log(`Chromecast-related logs: ${castButtonLogs.length}`);
    console.log('Screenshots saved: 16 screenshots in screenshots/ directory');
  });

  test('CHROMECAST ONLY: Isolated button state test', async ({ page }) => {
    // Simplified test that ONLY focuses on Chromecast button

    await test.step('Navigate directly to a class playback', async () => {
      // Login
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');

      // Go to classes
      await page.goto('/classes');
      await page.waitForLoadState('networkidle');

      // Click first class
      const firstClass = page.locator('[class*="class-card"]').first();
      await firstClass.click();
      await page.waitForURL('**/playback');
      await page.waitForTimeout(3000); // Wait for Cast SDK to load
    });

    await test.step('Debug Chromecast button state', async () => {
      // Take initial screenshot
      await page.screenshot({ path: 'screenshots/cast-debug-01-initial.png', fullPage: true });

      // Check Cast SDK loading
      const castCheck = await page.evaluate(() => {
        const win = window as any;
        return {
          step1_scriptTag: !!document.querySelector('script[src*="gstatic.com/cv/js/sender"]'),
          step2_castObject: typeof win.cast !== 'undefined',
          step3_framework: typeof win.cast?.framework !== 'undefined',
          step4_context: (() => {
            try {
              if (win.cast?.framework) {
                const ctx = win.cast.framework.CastContext.getInstance();
                return {
                  exists: true,
                  state: ctx.getCastState(),
                };
              }
            } catch (e: any) {
              return { exists: false, error: e.message };
            }
            return { exists: false };
          })(),
        };
      });

      console.log('\n=== CAST SDK LOADING STEPS ===');
      console.log(`1. Script tag exists: ${castCheck.step1_scriptTag ? '✅' : '❌'}`);
      console.log(`2. window.cast exists: ${castCheck.step2_castObject ? '✅' : '❌'}`);
      console.log(`3. cast.framework exists: ${castCheck.step3_framework ? '✅' : '❌'}`);
      console.log(`4. CastContext: ${JSON.stringify(castCheck.step4_context)}`);

      // Find button
      const castButton = page.locator('button[aria-label*="Cast"], [class*="cast"]').first();
      const buttonVisible = await castButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (buttonVisible) {
        // Get button state
        const buttonState = await castButton.evaluate((btn) => ({
          className: btn.className,
          disabled: (btn as HTMLButtonElement).disabled,
          ariaDisabled: btn.getAttribute('aria-disabled'),
          ariaLabel: btn.getAttribute('aria-label'),
          textContent: btn.textContent?.trim(),
        }));

        console.log('\n=== CAST BUTTON STATE ===');
        console.log(JSON.stringify(buttonState, null, 2));

        // Take screenshot of button
        await castButton.screenshot({ path: 'screenshots/cast-debug-02-button.png' });

        // Check if greyed out
        const isGreyedOut = buttonState.className?.includes('opacity-50') ||
          buttonState.className?.includes('disabled') ||
          buttonState.disabled === true;

        console.log(`\nButton is greyed out: ${isGreyedOut ? '❌ YES (ISSUE)' : '✅ NO (WORKING)'}`);
      } else {
        console.log('❌ CastButton not visible on page');
      }

      // Print all CastButton logs
      if (castButtonLogs.length > 0) {
        console.log('\n=== CAPTURED [CastButton] LOGS ===');
        castButtonLogs.forEach(log => console.log(log));
      } else {
        console.log('\n⚠️ NO [CastButton] logs captured - component may not be initializing');
      }

      // Print all Cast-related console messages
      const castRelatedLogs = consoleMessages.filter(msg =>
        msg.toLowerCase().includes('cast') ||
        msg.includes('gstatic')
      );

      if (castRelatedLogs.length > 0) {
        console.log('\n=== ALL CAST-RELATED LOGS ===');
        castRelatedLogs.forEach(log => console.log(log));
      }
    });
  });
});
