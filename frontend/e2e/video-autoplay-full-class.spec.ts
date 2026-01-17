/**
 * FULL CLASS VIDEO AUTO-PLAY TEST (Ralph-Loop Compatible)
 *
 * Purpose: Monitor video auto-play during natural movement transitions over a full 10-minute class
 *
 * This test:
 * 1. Generates a 10-minute Beginner class
 * 2. Starts playback and monitors natural transitions (timer-based, no manual clicks)
 * 3. Logs video state at each transition
 * 4. Reports whether videos auto-play correctly when timer advances to next movement
 * 5. Runs for full class duration (~10-12 minutes)
 *
 * Ralph-loop usage:
 *   /ralph-loop "npx playwright test e2e/video-autoplay-full-class.spec.ts --project=dev-chromium" --max-iterations 5
 */

import { test, expect, Page } from '@playwright/test';

// Test credentials from .env.test file
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'placeholder-password';

// Helper to handle medical disclaimer
async function handleMedicalDisclaimer(page: Page) {
  console.log('[MEDICAL] Checking for medical disclaimer...');

  const yesButton = page.locator('button:has-text("Yes")').first();
  const noButton = page.locator('button:has-text("No")').first();

  if (await yesButton.isVisible() && await noButton.isVisible()) {
    console.log('[MEDICAL] Found pregnancy question, answering "No"...');
    await noButton.click();
    await page.waitForTimeout(1000);

    console.log('[MEDICAL] Looking for disclaimer checkboxes...');
    const checkboxes = await page.locator('input[type="checkbox"]').all();
    if (checkboxes.length > 0) {
      console.log(`[MEDICAL] Found ${checkboxes.length} checkboxes, checking all...`);
      for (const checkbox of checkboxes) {
        if (await checkbox.isVisible() && !(await checkbox.isChecked())) {
          await checkbox.check();
        }
      }
      await page.waitForTimeout(500);
    }

    const acceptButton = page.locator('button:has-text("Accept")').first();
    if (await acceptButton.isVisible()) {
      console.log('[MEDICAL] Clicking Accept button...');
      await acceptButton.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(2000);
    }

    await page.evaluate(() => {
      localStorage.setItem('medical_disclaimer_accepted', 'true');
      localStorage.setItem('medical_disclaimer_accepted_date', Date.now().toString());
    });
    console.log('[MEDICAL] Medical disclaimer accepted and stored');
  }
}

// Helper to handle login
async function setupAndLogin(page: Page) {
  console.log('[AUTH] Starting login process...');
  await handleMedicalDisclaimer(page);

  const emailField = page.locator('input[type="email"], input[name*="email"], input[placeholder*="email"]').first();
  const passwordField = page.locator('input[type="password"], input[name*="password"], input[placeholder*="password"]').first();

  if (await emailField.isVisible() && await passwordField.isVisible()) {
    console.log('[AUTH] Found login form, filling credentials...');
    await emailField.fill(TEST_EMAIL);
    await passwordField.fill(TEST_PASSWORD);

    const submitButton = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")').first();
    if (await submitButton.isVisible()) {
      console.log('[AUTH] Clicking submit button...');
      await submitButton.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(3000);
      console.log('[AUTH] Login completed');
    }
  }
}

test.describe('Full Class Video Auto-Play', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    // Capture console messages
    page.on('console', msg => {
      if (msg.text().includes('🎥') || msg.text().includes('TRANSITION')) {
        console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      console.error(`[PAGE ERROR] ${error.message}`);
    });

    await page.goto('/');
    await setupAndLogin(page);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Monitor video auto-play during full 10-minute class', async () => {
    // 15 minutes total: 2 min setup + 10 min class + 3 min buffer
    test.setTimeout(900000); // 15 minutes

    console.log('\n========================================');
    console.log('🎬 FULL CLASS AUTO-PLAY TEST');
    console.log('========================================\n');

    // Navigate to class builder
    console.log('[STEP 1] Navigating to class builder...');
    const generateButton = page.locator('text=Generate');
    await generateButton.click();
    await page.waitForURL('**/class-builder', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Generate a 10-minute class
    console.log('[STEP 2] Generating 10-minute Beginner class...');
    await page.selectOption('select >> nth=0', { label: '10 minutes - Quick movement practise' });
    await page.selectOption('select >> nth=1', { label: 'Beginner' });
    await page.click('button:has-text("Generate Class Plan")');
    await page.waitForSelector('text=Your Auto-Generated Class', { timeout: 60000 });
    await page.click('button:has-text("Accept & Add to Class")');
    await page.waitForSelector('button:has-text("Play Class")', { timeout: 5000 });

    // Start playback
    console.log('[STEP 3] Starting class playback...');
    const playButton = page.locator('button:has-text("Play Class")');
    await playButton.click();
    await page.waitForSelector('.relative.h-full', { timeout: 10000 });
    await page.waitForTimeout(2000);

    console.log('\n[STEP 4] Monitoring natural transitions for 10 minutes...');
    console.log('─'.repeat(80));

    const transitionResults: any[] = [];
    let previousMovementName = '';
    const startTime = Date.now();
    const maxDuration = 12 * 60 * 1000; // 12 minutes max (10 min class + 2 min buffer)

    // Monitor for transitions every 5 seconds
    while (Date.now() - startTime < maxDuration) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);

      // Get current movement name
      const movementTitle = await page.locator('h1.text-6xl').first().textContent();
      const currentMovement = movementTitle?.trim() || 'Unknown';

      // Check if we transitioned to a new movement
      if (currentMovement !== previousMovementName && previousMovementName !== '') {
        console.log(`\n[${elapsed}s] ⏭️  TRANSITION DETECTED: "${previousMovementName}" → "${currentMovement}"`);

        // Wait 1 second for video to load
        await page.waitForTimeout(1000);

        // Check video state
        const video = page.locator('video').first();
        const videoExists = await video.count() > 0;

        if (videoExists) {
          const videoState = await video.evaluate((vid: HTMLVideoElement) => ({
            src: vid.src,
            paused: vid.paused,
            currentTime: vid.currentTime,
            readyState: vid.readyState,
            networkState: vid.networkState,
            error: vid.error ? vid.error.message : null
          }));

          const readyStateNames = ['HAVE_NOTHING', 'HAVE_METADATA', 'HAVE_CURRENT_DATA', 'HAVE_FUTURE_DATA', 'HAVE_ENOUGH_DATA'];
          const readyStateName = readyStateNames[videoState.readyState] || 'UNKNOWN';

          console.log(`   📹 Video src: ${videoState.src.split('/').pop()}`);
          console.log(`   📹 Paused: ${videoState.paused}, Time: ${videoState.currentTime.toFixed(2)}s, Ready: ${readyStateName}`);

          // Wait up to 6 seconds for video to start playing (4s delay + 2s buffer)
          let videoStarted = false;
          for (let i = 0; i < 12; i++) {
            await page.waitForTimeout(500);
            const playing = await video.evaluate((vid: HTMLVideoElement) => !vid.paused && vid.currentTime > 0);
            if (playing) {
              const checkTime = (i + 1) * 0.5;
              console.log(`   ✅ Video AUTO-PLAYED after ${checkTime}s`);
              videoStarted = true;
              break;
            }
          }

          if (!videoStarted) {
            console.log(`   ❌ Video DID NOT auto-play within 6 seconds`);
          }

          transitionResults.push({
            elapsed,
            from: previousMovementName,
            to: currentMovement,
            videoExists: true,
            videoStarted,
            ...videoState
          });
        } else {
          console.log(`   ⏭️  No video for this movement (expected for some movements)`);
          transitionResults.push({
            elapsed,
            from: previousMovementName,
            to: currentMovement,
            videoExists: false,
            videoStarted: false
          });
        }

        console.log('─'.repeat(80));
      }

      previousMovementName = currentMovement;

      // Check if class ended (look for completion message or return to class builder)
      const classEnded = await page.locator('text=Class Complete').isVisible().catch(() => false);
      if (classEnded) {
        console.log('\n✅ Class completed!');
        break;
      }

      await page.waitForTimeout(5000); // Check every 5 seconds
    }

    // Analysis
    console.log('\n[FINAL ANALYSIS]');
    console.log('─'.repeat(80));
    console.log(`Total transitions detected: ${transitionResults.length}`);

    const transitionsWithVideo = transitionResults.filter(r => r.videoExists);
    const successfulAutoPlays = transitionResults.filter(r => r.videoExists && r.videoStarted);

    console.log(`Transitions with video: ${transitionsWithVideo.length}`);
    console.log(`Successful auto-plays: ${successfulAutoPlays.length}`);

    if (transitionsWithVideo.length > 0) {
      const successRate = (successfulAutoPlays.length / transitionsWithVideo.length * 100).toFixed(1);
      console.log(`Auto-play success rate: ${successRate}%`);

      if (successfulAutoPlays.length === transitionsWithVideo.length) {
        console.log('✅ ALL videos auto-played successfully!');
      } else {
        console.log(`❌ ${transitionsWithVideo.length - successfulAutoPlays.length} videos failed to auto-play`);

        // List failures
        const failures = transitionResults.filter(r => r.videoExists && !r.videoStarted);
        failures.forEach(f => {
          console.log(`   - "${f.from}" → "${f.to}" at ${f.elapsed}s`);
        });
      }
    } else {
      console.log('⚠️  No transitions with video detected during test period');
    }

    console.log('─'.repeat(80));
    console.log('[TEST COMPLETE]\n');

    // Expect at least one successful auto-play if there were videos
    if (transitionsWithVideo.length > 0) {
      expect(successfulAutoPlays.length).toBeGreaterThan(0);
    }
  });
});
