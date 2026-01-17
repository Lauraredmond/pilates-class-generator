/**
 * MOBILE SAFARI AUTO-PLAY TEST
 *
 * Tests video auto-play on mobile Safari specifically (iPhone 12 device emulation)
 * This reproduces the user's reported issue where videos don't auto-play on natural transitions
 */

import { test, expect, Page, devices } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'placeholder-password';

async function handleMedicalDisclaimer(page: Page) {
  const yesButton = page.locator('button:has-text("Yes")').first();
  const noButton = page.locator('button:has-text("No")').first();

  if (await yesButton.isVisible() && await noButton.isVisible()) {
    await noButton.click();
    await page.waitForTimeout(1000);

    const checkboxes = await page.locator('input[type="checkbox"]').all();
    for (const checkbox of checkboxes) {
      if (await checkbox.isVisible() && !(await checkbox.isChecked())) {
        await checkbox.check();
      }
    }
    await page.waitForTimeout(500);

    const acceptButton = page.locator('button:has-text("Accept")').first();
    if (await acceptButton.isVisible()) {
      await acceptButton.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(2000);
    }

    await page.evaluate(() => {
      localStorage.setItem('medical_disclaimer_accepted', 'true');
      localStorage.setItem('medical_disclaimer_accepted_date', Date.now().toString());
    });
  }
}

async function setupAndLogin(page: Page) {
  await handleMedicalDisclaimer(page);

  const emailField = page.locator('input[type="email"]').first();
  const passwordField = page.locator('input[type="password"]').first();

  if (await emailField.isVisible() && await passwordField.isVisible()) {
    await emailField.fill(TEST_EMAIL);
    await passwordField.fill(TEST_PASSWORD);

    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(3000);
    }
  }
}

test.describe('Mobile Safari Video Auto-Play', () => {
  test('Reproduce mobile Safari autoplay failure', async ({ browser }) => {
    test.setTimeout(600000); // 10 minutes

    const context = await browser.newContext({
      ...devices['iPhone 12'],
    });
    const page = await context.newPage();

    // Capture console logs
    page.on('console', msg => {
      if (msg.text().includes('🎥') || msg.text().includes('play') || msg.text().includes('video')) {
        console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      console.error(`[PAGE ERROR] ${error.message}`);
    });

    await page.goto('https://bassline-dev.netlify.app');
    await setupAndLogin(page);

    console.log('\n=== MOBILE SAFARI AUTO-PLAY TEST ===\n');

    // Generate class
    console.log('[STEP 1] Generating 10-minute class...');
    await page.click('text=Generate');
    await page.waitForURL('**/class-builder', { timeout: 10000 });
    await page.waitForTimeout(2000);

    await page.selectOption('select >> nth=0', { label: '10 minutes - Quick movement practise' });
    await page.selectOption('select >> nth=1', { label: 'Beginner' });
    await page.click('button:has-text("Generate Class Plan")');
    await page.waitForSelector('text=Your Auto-Generated Class', { timeout: 60000 });
    await page.click('button:has-text("Accept & Add to Class")');
    await page.waitForSelector('button:has-text("Play Class")', { timeout: 5000 });

    // Start playback
    console.log('[STEP 2] Starting class playback...');
    await page.click('button:has-text("Play Class")');
    await page.waitForSelector('.relative.h-full', { timeout: 10000 });
    await page.waitForTimeout(2000);

    console.log('[STEP 3] Checking first video (should work - user gesture)...');
    const firstVideo = page.locator('video').first();
    if (await firstVideo.count() > 0) {
      await page.waitForTimeout(5000); // Wait for 4s delay + 1s buffer
      const firstVideoPlaying = await firstVideo.evaluate((vid: HTMLVideoElement) => !vid.paused);
      console.log(`   First video playing: ${firstVideoPlaying ? 'YES ✅' : 'NO ❌'}`);
    }

    console.log('[STEP 4] Waiting for natural transition (~3 minutes)...');
    console.log('   Checking every 10 seconds for movement change...');

    let previousMovement = '';
    let transitionDetected = false;
    const startTime = Date.now();

    while (!transitionDetected && (Date.now() - startTime) < 240000) { // 4 minute max
      const currentMovement = await page.locator('h1.text-6xl').first().textContent();

      if (currentMovement && currentMovement !== previousMovement && previousMovement !== '') {
        console.log(`\n[TRANSITION] "${previousMovement}" → "${currentMovement}"`);
        transitionDetected = true;

        // Wait 1 second for video to load
        await page.waitForTimeout(1000);

        // Check if video exists
        const video = page.locator('video').first();
        const videoExists = await video.count() > 0;

        if (videoExists) {
          console.log('   Video element found');

          // Check if play() was called
          const playAttemptLogs = await page.evaluate(() => {
            return (window as any).videoPlayAttempts || [];
          });
          console.log(`   Play attempts logged: ${playAttemptLogs.length}`);

          // Wait up to 6 seconds for video to start
          let videoStarted = false;
          for (let i = 0; i < 12; i++) {
            await page.waitForTimeout(500);
            const playing = await video.evaluate((vid: HTMLVideoElement) => !vid.paused && vid.currentTime > 0);
            if (playing) {
              console.log(`   ✅ Video AUTO-PLAYED after ${(i + 1) * 0.5}s`);
              videoStarted = true;
              break;
            }
          }

          if (!videoStarted) {
            console.log('   ❌ VIDEO DID NOT AUTO-PLAY');

            // Get video state details
            const videoState = await video.evaluate((vid: HTMLVideoElement) => ({
              paused: vid.paused,
              currentTime: vid.currentTime,
              readyState: vid.readyState,
              muted: vid.muted,
              autoplay: vid.autoplay,
              src: vid.src
            }));
            console.log('   Video state:', JSON.stringify(videoState, null, 2));

            // Take screenshot
            await page.screenshot({ path: 'mobile-safari-autoplay-failure.png', fullPage: true });
            console.log('   Screenshot saved: mobile-safari-autoplay-failure.png');
          }

          // FAIL test if video didn't auto-play
          expect(videoStarted).toBeTruthy();
        } else {
          console.log('   No video for this movement (skipping)');
        }
      }

      previousMovement = currentMovement || '';
      await page.waitForTimeout(10000); // Check every 10 seconds
    }

    if (!transitionDetected) {
      console.log('\n❌ No transition detected within 4 minutes');
      throw new Error('Timeout waiting for natural transition');
    }

    await page.close();
  });
});
