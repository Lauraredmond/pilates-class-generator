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
 * Setup:
 *   Credentials are stored in frontend/.env.test (gitignored, not committed)
 *   Dev account: [credentials in .env.test]
 *   Password: See .env.test file
 *
 * Usage:
 *   # Test dev environment (uses .env.test credentials)
 *   cd frontend
 *   npm run test:e2e:clickthrough:dev
 *
 *   # Or run manually
 *   npx playwright test full-clickthrough-with-cast.spec.ts --headed
 *
 *   # Test on mobile (iPhone simulation)
 *   npm run test:e2e:clickthrough:mobile
 *
 *   # Chromecast-only test (faster, 20 seconds)
 *   npm run test:e2e:cast
 */

// Load test credentials from .env.test file
// Default credentials loaded from environment variables
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'testpassword',
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

    // Capture network requests to see if Cast SDK loads
    page.on('request', (request) => {
      if (request.url().includes('gstatic.com') || request.url().includes('cast')) {
        console.log(`[NETWORK REQUEST] ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', (response) => {
      if (response.url().includes('gstatic.com') || response.url().includes('cast')) {
        console.log(`[NETWORK RESPONSE] ${response.status()} ${response.url()}`);
      }
    });

    page.on('requestfailed', (request) => {
      if (request.url().includes('gstatic.com') || request.url().includes('cast')) {
        console.log(`[NETWORK FAILED] ${request.url()} - ${request.failure()?.errorText}`);
      }
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

      // Handle Medical Safety Disclaimer flow (multi-step)
      const disclaimerModal = page.locator('text=Medical Safety Disclaimer');
      const modalVisible = await disclaimerModal.isVisible({ timeout: 3000 }).catch(() => false);

      if (modalVisible) {
        console.log('Medical disclaimer modal detected, handling multi-step flow...');

        // Step 1: Answer pregnancy/postnatal question
        const pregnancyQuestion = page.locator('button:has-text("No")');
        if (await pregnancyQuestion.isVisible({ timeout: 2000 }).catch(() => false)) {
          await pregnancyQuestion.click();
          await page.waitForTimeout(500);
          console.log('  ✓ Pregnancy question answered');
        }

        // Step 2: Check required checkboxes
        const checkbox1 = page.locator('input[type="checkbox"]').first();
        const checkbox2 = page.locator('input[type="checkbox"]').nth(1);

        if (await checkbox1.isVisible({ timeout: 2000 }).catch(() => false)) {
          await checkbox1.check();
          await checkbox2.check();
          await page.waitForTimeout(300);
          console.log('  ✓ Checkboxes completed');
        }

        // Step 3: Click "Accept - Continue to App" button
        const acceptButton = page.locator('button:has-text("Accept - Continue to App")');
        if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await acceptButton.click();
          await page.waitForTimeout(500);
          console.log('  ✓ Disclaimer accepted');
          await page.screenshot({ path: 'screenshots/01b-disclaimer-completed.png', fullPage: true });
        }
      }

      // Fill credentials
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.screenshot({ path: 'screenshots/02-login-filled.png', fullPage: true });

      // Submit
      await page.click('button[type="submit"]');

      // Wait for successful login (redirects to home page or dashboard)
      await page.waitForURL(/\/$|\/dashboard/, { timeout: 15000 });
      await page.screenshot({ path: 'screenshots/03-after-login.png', fullPage: true });

      // Verify we're logged in (check for nav links or buttons)
      const loggedInIndicator = page.locator('text="Generate my Pilates class", a[href="/classes"]');
      await expect(loggedInIndicator.first()).toBeVisible();
      console.log('✅ Step 1: Login successful');
    });

    // ========================================
    // STEP 2: Navigate to Class Builder
    // ========================================
    await test.step('2. Navigate to class builder', async () => {
      // Click "Generate my Pilates class" button on home screen
      const generateButton = page.locator('button:has-text("Generate my Pilates class")');
      await generateButton.click();

      await page.waitForURL('**/class-builder', { timeout: 10000 });
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'screenshots/04-class-builder.png', fullPage: true });

      await expect(page).toHaveURL(/class-builder/);
      console.log('✅ Step 2: Navigated to class builder');
    });

    // ========================================
    // STEP 3 & 4: Generate or Accept Existing Class
    // ========================================
    await test.step('3-4. Generate or accept existing class', async () => {
      // Check if there's already a generated class on the page
      const acceptExistingButton = page.locator('button:has-text("Accept & Add to Class")');
      const hasPreGeneratedClass = await acceptExistingButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasPreGeneratedClass) {
        console.log('Found pre-generated class on page, using it...');

        // Take screenshot of pre-generated class
        await page.screenshot({ path: 'screenshots/05-pre-generated-class.png', fullPage: true });

        // Verify class sections are visible
        const movementCount = await page.locator('text=/\\d+ movements?/i').first().textContent();
        const durationText = await page.locator('text=/\\d+m/').first().textContent();
        console.log(`Pre-generated class: ${movementCount}, Duration: ${durationText}`);

        // Click Accept & Add to Class
        await acceptExistingButton.click();
        console.log('✅ Step 3-4: Accepted pre-generated class');

        // Wait for save
        await page.waitForTimeout(3000);
      } else {
        console.log('No pre-generated class found, generating new one...');

        // STEP 3: Fill Form
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

        // STEP 4: Generate Class
        const generateButton = page.locator('button:has-text("Generate"), button:has-text("Create Class")').first();
        await generateButton.click();

        // Wait for results modal
        const resultsModal = page.locator('[role="dialog"], .modal, [class*="modal"]').filter({ hasText: /Generated|Results|Complete/i });
        await expect(resultsModal).toBeVisible({ timeout: 15000 });

        await page.screenshot({ path: 'screenshots/06-generation-results.png', fullPage: true });
        console.log('✅ Step 4: Class generated successfully');

        // Accept the generated class
        const acceptButton = page.locator('button:has-text("Accept"), button:has-text("Save"), button:has-text("Add to Library")').first();
        await acceptButton.click();
        await page.waitForTimeout(2000);
      }
    });

    // ========================================
    // STEP 5: Navigate to Classes Library
    // ========================================
    await test.step('5. Navigate to classes library', async () => {
      // Check if we're already on classes page or need to navigate
      const currentUrl = page.url();
      if (!currentUrl.includes('/classes')) {
        // Navigate to classes
        const classesLink = page.locator('a[href*="/classes"], nav a:has-text("Classes"), button:has-text("Classes")').first();
        if (await classesLink.isVisible({ timeout: 2000 }).catch(() => false)) {
          await classesLink.click();
        } else {
          // Direct navigation as fallback
          await page.goto('/classes');
        }
      }

      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'screenshots/07-classes-page.png', fullPage: true });

      console.log('✅ Step 5: Navigated to classes library');
    });

    // ========================================
    // STEP 6: Start Playback
    // ========================================
    await test.step('6. Start class playback', async () => {
      // The classes page might show different layouts
      // Try multiple selectors for class cards or play buttons
      const playSelectors = [
        '[class*="class-card"]',
        'button:has-text("Start Class")',
        'button:has-text("Play")',
        'button:has-text("View Class")',
        '[data-testid*="class"]'
      ];

      let classClicked = false;
      for (const selector of playSelectors) {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
          await element.click();
          classClicked = true;
          console.log(`Clicked class using selector: ${selector}`);
          break;
        }
      }

      if (!classClicked) {
        // Alternative: "Training & Nutrition Hub" flow
        const trainingButton = page.locator('button:has-text("Log my training plan")');
        if (await trainingButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('Classes page shows Training Hub, clicking "Log my training plan"...');
          await trainingButton.click();
          await page.waitForTimeout(2000);

          // Now look for class card
          const classCard = page.locator('[class*="class-card"]').first();
          if (await classCard.isVisible({ timeout: 3000 }).catch(() => false)) {
            await classCard.click();
            classClicked = true;
          }
        }
      }

      if (!classClicked) {
        throw new Error('Could not find any class to start playback');
      }

      // Wait for playback page
      await page.waitForURL('**/playback/**', { timeout: 10000 });
      await page.waitForTimeout(3000); // Wait for playback to fully initialize
      await page.screenshot({ path: 'screenshots/08-playback-started.png', fullPage: true });

      console.log('✅ Step 6: Playback started');
    });

    // ========================================
    // STEP 7: CHROMECAST BUTTON DEBUGGING
    // ========================================
    await test.step('7. Test and debug Chromecast button', async () => {
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
      console.log('✅ Step 7: Chromecast debugging complete');
    });

    // ========================================
    // STEP 8: Test Music Playback
    // ========================================
    await test.step('8. Verify music player', async () => {
      // Check for audio element
      const audioElement = page.locator('audio').first();
      await expect(audioElement).toBeVisible({ timeout: 5000 });

      // Check if music has src
      const audioSrc = await audioElement.getAttribute('src');
      expect(audioSrc).toBeTruthy();

      console.log(`Music source: ${audioSrc}`);
      console.log('✅ Step 8: Music player verified');
    });

    // ========================================
    // STEP 9: Test Exit Modal Buttons (iOS fix)
    // ========================================
    await test.step('9. Test exit confirmation modal buttons', async () => {
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
          console.log('✅ Step 9: Exit modal buttons verified (iOS fix working)');
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
    console.log('Screenshots saved: Multiple screenshots in screenshots/ directory');
  });

  test('CHROMECAST ONLY: Isolated button state test', async ({ page }) => {
    // Simplified test that ONLY focuses on Chromecast button

    await test.step('Navigate directly to a class playback', async () => {
      // Login
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Handle Medical Safety Disclaimer flow (multi-step)
      const disclaimerModal = page.locator('text=Medical Safety Disclaimer');
      const modalVisible = await disclaimerModal.isVisible({ timeout: 3000 }).catch(() => false);

      if (modalVisible) {
        // Step 1: Answer pregnancy question
        const pregnancyQuestion = page.locator('button:has-text("No")');
        if (await pregnancyQuestion.isVisible({ timeout: 2000 }).catch(() => false)) {
          await pregnancyQuestion.click();
          await page.waitForTimeout(500);
        }

        // Step 2: Check checkboxes
        const checkbox1 = page.locator('input[type="checkbox"]').first();
        const checkbox2 = page.locator('input[type="checkbox"]').nth(1);
        if (await checkbox1.isVisible({ timeout: 2000 }).catch(() => false)) {
          await checkbox1.check();
          await checkbox2.check();
          await page.waitForTimeout(300);
        }

        // Step 3: Accept
        const acceptButton = page.locator('button:has-text("Accept - Continue to App")');
        if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await acceptButton.click();
          await page.waitForTimeout(500);
        }
      }

      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');

      // Wait for successful login (redirects to home page)
      await page.waitForURL(/\/$|\/dashboard/, { timeout: 15000 });
      await page.waitForLoadState('networkidle');

      // Click "Generate my Pilates class" button on home screen
      const generateButton = page.locator('button:has-text("Generate my Pilates class")');
      await generateButton.click();
      await page.waitForURL('**/class-builder', { timeout: 10000 });
      await page.waitForLoadState('networkidle');

      console.log('On class builder page...');

      // Wait for the page to fully render (give more time for modal to appear)
      await page.waitForTimeout(5000);

      // Take a screenshot for debugging
      await page.screenshot({ path: 'screenshots/cast-class-builder-state.png', fullPage: true });

      // FIRST: Check if the "Your Auto-Generated Class" modal/overlay is displayed
      // Try multiple selectors as the text might be rendered differently
      const modalSelectors = [
        'text="Your Auto-Generated Class"',
        'text=/Your.*Auto.*Generated.*Class/i',
        'h2:has-text("Your Auto-Generated Class")',
        ':has-text("Your Auto-Generated Class")',
        'text="Review the generated sequence"'
      ];

      let classModalVisible = false;
      for (const selector of modalSelectors) {
        const element = page.locator(selector);
        const isVisible = await element.isVisible({ timeout: 1000 }).catch(() => false);
        if (isVisible) {
          classModalVisible = true;
          console.log(`Found modal with selector: ${selector}`);
          break;
        }
      }

      if (classModalVisible) {
        console.log('Found "Your Auto-Generated Class" modal displayed');

        // Take screenshot of the modal
        await page.screenshot({ path: 'screenshots/cast-pre-generated-class.png', fullPage: true });

        // Look for the Accept button - try multiple strategies
        // Strategy 1: Direct text match
        let acceptButton = page.locator('button:has-text("Accept & Add to Class")');
        let acceptButtonVisible = await acceptButton.isVisible({ timeout: 2000 }).catch(() => false);

        if (!acceptButtonVisible) {
          // Strategy 2: Look for button with both "Accept" and "Add" text
          acceptButton = page.locator('button').filter({ hasText: /Accept.*Add/i });
          acceptButtonVisible = await acceptButton.isVisible({ timeout: 2000 }).catch(() => false);
        }

        if (!acceptButtonVisible) {
          // Strategy 3: Look through all buttons
          const allButtons = await page.locator('button').all();
          console.log(`Found ${allButtons.length} total buttons on page`);

          for (const btn of allButtons) {
            const text = await btn.textContent().catch(() => '');
            const isVisible = await btn.isVisible().catch(() => false);
            console.log(`  Button: "${text?.trim()}" (visible: ${isVisible})`);

            if (text && text.includes('Accept') && text.includes('Add') && isVisible) {
              acceptButton = btn;
              acceptButtonVisible = true;
              console.log(`Found Accept button with text: "${text}"`);
              break;
            }
          }
        }

        if (acceptButtonVisible) {
          console.log('Clicking Accept & Add to Class button...');
          await acceptButton.click();
          console.log('Clicked Accept button');

          // Wait for save to complete
          await page.waitForTimeout(3000);

          // Check if we're still on class-builder or redirected
          const currentUrl = page.url();
          console.log(`Current URL after accepting class: ${currentUrl}`);

          if (!currentUrl.includes('/classes') && !currentUrl.includes('/playback')) {
            console.log('Not redirected, navigating to classes page...');
            await page.goto('/classes');
            await page.waitForLoadState('networkidle');
          }
        } else {
          console.log('ERROR: Could not find Accept & Add to Class button despite modal being visible');
          throw new Error('Accept button not found in visible modal');
        }
      } else {
        console.log('No "Your Auto-Generated Class" modal found via text, checking for Accept button directly...');

        // Even if we didn't detect the modal text, check if Accept button is visible
        const acceptButtonDirect = page.locator('button:has-text("Accept & Add to Class")');
        const acceptButtonDirectVisible = await acceptButtonDirect.isVisible({ timeout: 2000 }).catch(() => false);

        if (acceptButtonDirectVisible) {
          console.log('Found Accept & Add to Class button directly (modal may be present but text not detected)');
          await acceptButtonDirect.click();
          console.log('Clicked Accept button');
          await page.waitForTimeout(3000);

          // Check if we're still on class-builder or redirected
          const currentUrl = page.url();
          console.log(`Current URL after accepting class: ${currentUrl}`);

          if (!currentUrl.includes('/classes') && !currentUrl.includes('/playback')) {
            console.log('Not redirected, navigating to classes page...');
            await page.goto('/classes');
            await page.waitForLoadState('networkidle');
          }
        } else {
          console.log('No Accept button found, checking for Play Class button...');

          // Check if there's a Play Class button on the page
          const playButton = page.locator('button:has-text("Play Class")');
          const playButtonVisible = await playButton.isVisible({ timeout: 2000 }).catch(() => false);

          if (playButtonVisible) {
            const playButtonEnabled = await playButton.isEnabled().catch(() => false);

            if (playButtonEnabled) {
              console.log('Found enabled Play Class button, clicking it to start playback directly...');
              await playButton.click();

            // Wait for playback page
            await page.waitForURL(/playback/i, { timeout: 10000 }).catch(() => {
              console.log('Did not navigate to playback, may still be on class-builder');
            });
            await page.waitForTimeout(3000);

            // Skip the rest of navigation since we're going straight to playback
            const currentUrl = page.url();
            if (currentUrl.includes('/playback')) {
              console.log('Successfully navigated to playback');
              // Skip to Cast SDK testing
              await page.waitForTimeout(3000);
              console.log('Current URL after navigation:', page.url());
              // The test will continue to the Debug Chromecast button state step
              return; // Exit this step early
            }
          } else {
            console.log('Play Class button is disabled (as expected before class is generated)');

            // Check if there's actually a pre-generated class on the page that needs to be generated first
            const hasGeneratedClass = await page.locator('text="Your Auto-Generated Class"').isVisible({ timeout: 2000 }).catch(() => false);

            if (hasGeneratedClass) {
              console.log('Class is already generated but not accepted, need to click Generate Class Plan to refresh it');

              // Click Generate Class Plan to regenerate
              const generateButton = page.locator('button:has-text("Generate Class Plan")');
              if (await generateButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                console.log('Clicking Generate Class Plan button...');
                await generateButton.click();

                // Wait a moment for the generation to complete
                await page.waitForTimeout(5000);

                // Now look for the Accept button in the refreshed view
                const acceptButtonAfterGen = page.locator('button:has-text("Accept & Add to Class")');
                if (await acceptButtonAfterGen.isVisible({ timeout: 5000 }).catch(() => false)) {
                  console.log('Found Accept button after regeneration, clicking it...');
                  await acceptButtonAfterGen.click();
                  await page.waitForTimeout(3000);

                  // Now Play Class button should be enabled
                  await expect(playButton).toBeEnabled({ timeout: 10000 });
                  console.log('Play Class button is now enabled, clicking it...');
                  await playButton.click();

                  // Wait for playback to start (ClassPlayback component renders inline)
                  await page.waitForTimeout(3000);
                  console.log('Playback should have started inline on class-builder page');

                  // Skip navigation since playback is inline
                  return; // Exit this step early
                } else {
                  console.log('No Accept button found after regeneration, may be inline update');
                }
              }
            } else {
              console.log('No pre-generated class, need to generate a new one from scratch');

              // Fill in basic class parameters
              // Select difficulty (Beginner)
              const beginnerButton = page.locator('button:has-text("Beginner")').first();
              if (await beginnerButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                await beginnerButton.click();
              }

              // Set duration (30 minutes) - look for slider or input
              const durationSlider = page.locator('input[type="range"]').first();
              if (await durationSlider.isVisible({ timeout: 2000 }).catch(() => false)) {
                await durationSlider.fill('30');
              }

              // Ensure AI mode is OFF (database mode for faster generation)
              const aiToggle = page.locator('button[role="switch"], input[type="checkbox"]').filter({ hasText: /AI/i });
              if (await aiToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
                const isChecked = await aiToggle.getAttribute('aria-checked');
                if (isChecked === 'true') {
                  await aiToggle.click();
                }
              }

              // Click Generate button to create the class
              const generateClassButton = page.locator('button:has-text("Generate"), button:has-text("Create Class")').first();
              console.log('Clicking Generate button...');
              await generateClassButton.click();

              // Wait longer for generation to complete (AI or database mode)
              console.log('Waiting for class generation to complete (up to 10 seconds)...');

              // Wait for EITHER the modal to appear OR inline results
              const generationComplete = await Promise.race([
                // Option 1: Modal appears with "Your Auto-Generated Class"
                page.locator('text="Your Auto-Generated Class"').waitFor({ state: 'visible', timeout: 10000 }).then(() => 'modal'),
                // Option 2: Results modal with different text
                page.locator('[role="dialog"]').filter({ hasText: /sequence|movement|result/i }).waitFor({ state: 'visible', timeout: 10000 }).then(() => 'dialog'),
                // Option 3: Accept button appears (inline results)
                page.locator('button:has-text("Accept & Add to Class")').waitFor({ state: 'visible', timeout: 10000 }).then(() => 'accept-button'),
              ]).catch(() => {
                console.log('Generation timed out after 10 seconds');
                return 'timeout';
              });

              console.log(`Generation result detected: ${generationComplete}`);

              if (generationComplete === 'timeout') {
                console.log('ERROR: Class generation timed out or failed');
                await page.screenshot({ path: 'screenshots/cast-generation-timeout.png', fullPage: true });
              }

              // Now look for Accept button with better detection
              console.log('Looking for Accept & Add to Class button...');

              // Wait up to 5 seconds for Accept button to be visible
              const acceptButton = page.locator('button:has-text("Accept & Add to Class")');
              const acceptButtonVisible = await acceptButton.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);

              if (acceptButtonVisible) {
                console.log('✅ Found Accept button, clicking it...');
                await acceptButton.click();

                // Modal should close automatically within 5 seconds
                console.log('Waiting for modal to close automatically (up to 5 seconds)...');
                const modalOverlay = page.locator('.fixed.inset-0.z-50, [role="dialog"]');

                await modalOverlay.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {
                  console.log('⚠️ Modal did not close within 5 seconds');
                });

                // Double-check if modal is gone
                const modalStillVisible = await modalOverlay.isVisible({ timeout: 1000 }).catch(() => false);
                if (modalStillVisible) {
                  console.log('⚠️ Modal still visible, attempting manual close...');
                  await page.keyboard.press('Escape');
                  await page.waitForTimeout(500);
                } else {
                  console.log('✅ Modal closed successfully');
                }

                console.log('Accept button clicked, class saved, modal closed');
              } else {
                console.log('❌ ERROR: Could not find Accept button after class generation');
                await page.screenshot({ path: 'screenshots/cast-no-accept-button-error.png', fullPage: true });
              }

              // After accepting class and modal closing, Play Class button should be accessible
              console.log('\n=== STARTING PLAYBACK ===');

              // Now find and click Play Class button
              console.log('Looking for Play Class button...');
              const playClassButton = page.locator('button:has-text("Play Class")');

              // Wait for button to exist and be enabled
              const buttonReady = await playClassButton.waitFor({ state: 'visible', timeout: 5000 })
                .then(() => playClassButton.isEnabled())
                .catch(() => false);

              if (!buttonReady) {
                console.log('❌ ERROR: Play Class button not found or not enabled');
                await page.screenshot({ path: 'screenshots/cast-play-button-not-ready.png', fullPage: true });
              } else {
                console.log('✅ Play Class button is ready, clicking it...');

                // Take screenshot before clicking
                await page.screenshot({ path: 'screenshots/cast-before-play-click.png', fullPage: true });

                // Click with force to bypass any potential overlay issues
                await playClassButton.click({ force: true });

                // Wait for playback to initialize
                console.log('Waiting for ClassPlayback component to render (3 seconds)...');
                await page.waitForTimeout(3000);

                // Take screenshot after clicking to see if playback started
                await page.screenshot({ path: 'screenshots/cast-after-play-click.png', fullPage: true });

                console.log('Play Class button clicked');
              }
            }
          }
          } else {
            console.log('No Play Class button found on page');

            // Since we can't navigate to /playback (route doesn't exist), we need to ensure class is generated
            console.log('ERROR: Cannot test playback without generating a class first');
          }
        }
      }

      // No navigation needed - playback happens inline on class-builder page
      console.log('Staying on class-builder page for inline playback...');
      await page.waitForTimeout(3000);
      console.log('Current URL:', page.url());
    });

    await test.step('Debug Chromecast button state', async () => {
      // Take initial screenshot
      await page.screenshot({ path: 'screenshots/cast-debug-01-initial.png', fullPage: true });

      // First check if ClassPlayback is rendering (look for playback-specific elements)
      const isPlaybackActive = await page.locator('.absolute.inset-0.bg-burgundy-dark').isVisible({ timeout: 2000 }).catch(() => false) ||
                              await page.locator('text=/Preparation|Warmup|Movement|Cooldown|Meditation|HomeCare/i').isVisible({ timeout: 2000 }).catch(() => false);

      console.log(`\nClassPlayback component active: ${isPlaybackActive ? '✅ YES' : '❌ NO'}`);

      if (!isPlaybackActive) {
        console.log('ClassPlayback not rendering - may need to click Play Class button');
      }

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

      // Try multiple selectors to find the Cast button
      console.log('\n=== CHECKING CASTBUTTON COMPONENT ===');

      // Look for the Cast button multiple ways
      // 1. By aria-label (most specific)
      const castButtonByAria = page.locator('button[aria-label="Cast to TV"], button[aria-label="Connected to TV"], button[aria-label="No Cast devices found"]');
      // 2. By the Cast icon SVG (the lucide-react Cast icon has specific attributes)
      const castButtonByIcon = page.locator('button:has(svg):has(path[d*="M2 8V6"])');  // Part of Cast icon path
      // 3. By position (absolute top-4 right-16 z-10 as defined in ClassPlayback.tsx)
      const castButtonByPosition = page.locator('.absolute.top-4.right-16.z-10 button');
      // 4. Generic cast class search
      const castButtonByClass = page.locator('button[class*="cast"], [class*="cast-button"]');

      // Try each selector
      let castButton = null;
      let castButtonVisible = false;

      // Try aria-label first
      castButtonVisible = await castButtonByAria.isVisible({ timeout: 2000 }).catch(() => false);
      if (castButtonVisible) {
        castButton = castButtonByAria;
        console.log('✅ Found CastButton by aria-label');
      }

      // If not found, try icon selector
      if (!castButtonVisible) {
        castButtonVisible = await castButtonByIcon.isVisible({ timeout: 2000 }).catch(() => false);
        if (castButtonVisible) {
          castButton = castButtonByIcon;
          console.log('✅ Found CastButton by Cast icon SVG');
        }
      }

      // If still not found, try position selector
      if (!castButtonVisible) {
        castButtonVisible = await castButtonByPosition.isVisible({ timeout: 2000 }).catch(() => false);
        if (castButtonVisible) {
          castButton = castButtonByPosition;
          console.log('✅ Found CastButton by position (.absolute.top-4.right-16)');
        }
      }

      // If still not found, try class selector
      if (!castButtonVisible) {
        castButtonVisible = await castButtonByClass.isVisible({ timeout: 2000 }).catch(() => false);
        if (castButtonVisible) {
          castButton = castButtonByClass;
          console.log('✅ Found CastButton by class name');
        }
      }

      if (castButtonVisible && castButton) {
        console.log('✅ CastButton component is visible on page');

        // Get button state and properties
        const buttonState = await castButton.evaluate((btn) => {
          // Get computed styles
          const styles = window.getComputedStyle(btn);
          // Check for SVG icon inside button
          const svgIcon = btn.querySelector('svg');
          return {
            className: btn.className,
            disabled: (btn as HTMLButtonElement).disabled,
            ariaDisabled: btn.getAttribute('aria-disabled'),
            ariaLabel: btn.getAttribute('aria-label'),
            title: btn.getAttribute('title') || '',
            opacity: styles.opacity,
            cursor: styles.cursor,
            backgroundColor: styles.backgroundColor,
            color: styles.color,
            hasSvgIcon: !!svgIcon,
            svgClassName: svgIcon?.getAttribute('class') || '',
            innerHTML: btn.innerHTML.substring(0, 200) // First 200 chars to see content
          };
        });

        console.log('\n=== CAST BUTTON STATE ===');
        console.log(JSON.stringify(buttonState, null, 2));

        // Take screenshot of button
        await castButton.screenshot({ path: 'screenshots/cast-debug-02-button.png' });

        // Check if greyed out
        const isGreyedOut = buttonState.disabled ||
                           buttonState.className?.includes('cursor-not-allowed') ||
                           buttonState.cursor === 'not-allowed' ||
                           buttonState.className?.includes('text-cream/30');

        console.log(`\nButton is greyed out: ${isGreyedOut ? '❌ YES (FAILED - should be white/active after CSP fix)' : '✅ NO (Chromecast devices detectable)'}`);

        if (isGreyedOut) {
          console.log('\n❌ CRITICAL: CHROMECAST ICON IS GREYED OUT');
          console.log('EXPECTED: WHITE/ACTIVE (devices detectable) after CSP fix (commit d3391bbd)');
          console.log('ACTUAL: GREYED OUT/DISABLED');
          console.log('\nPossible causes:');
          console.log('1. CSP fix not deployed to this environment yet');
          console.log('2. Browser cache needs clearing (old CSP headers cached)');
          console.log('3. No Chromecast device on test network');
          console.log('4. Chromecast powered off or in guest-mode only');
          console.log('5. Different WiFi network (phone vs Chromecast)');

          await page.screenshot({ path: 'screenshots/cast-button-greyed-out-FAILURE.png' });
        }

        // UPDATED EXPECTATION: After CSP fix (commit d3391bbd), icon should be WHITE/ACTIVE
        // If greyed out, this indicates a problem (CSP not deployed, cache issue, or no device on network)
        // Test will PASS if icon is white/active, FAIL if greyed out
        expect(isGreyedOut, 'Cast icon should be WHITE/ACTIVE (not greyed out) after CSP fix - greyed out indicates CSP not deployed or no Chromecast on network').toBe(false);
      } else {
        console.log('❌ CastButton not visible on page');
        console.log('Possible issues:');
        console.log('1. Component not rendering in ClassPlayback');
        console.log('2. CSS hiding the button');
        console.log('3. Conditional rendering preventing display');

        // Check if the position div exists at all
        const positionDiv = await page.locator('.absolute.top-4.right-16.z-10').isVisible({ timeout: 2000 }).catch(() => false);
        console.log(`Div at expected position (.absolute.top-4.right-16.z-10): ${positionDiv ? 'YES' : 'NO'}`);

        // Check for any button near the close button
        const buttonsNearTop = await page.locator('.absolute.top-4 button').count();
        console.log(`Number of buttons in top area: ${buttonsNearTop}`);
      }

      // Print all CastButton logs (production builds won't have debug logs)
      console.log('\n=== CASTBUTTON CONSOLE LOGS ===');
      if (castButtonLogs.length > 0) {
        console.log('CastButton logs found:');
        castButtonLogs.forEach(log => console.log(`  ${log}`));
      } else {
        console.log('ℹ️ No [CastButton] debug logs captured');
        console.log('This is expected - debug logs are disabled in production builds');
        console.log('The component may still be working correctly');
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
