/**
 * DIAGNOSTIC TEST: Video Auto-Play Issue Investigation
 *
 * Purpose: Understand EXACTLY why videos don't auto-play when transitioning between movements
 *
 * This test will:
 * 1. Navigate to class playback
 * 2. Start playing first movement with video
 * 3. Click "Next movement" button
 * 4. Log video state every 500ms for 10 seconds
 * 5. Capture screenshots at key moments
 * 6. Check for browser console errors
 * 7. Report EXACTLY when/if video starts playing
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

test.describe('Video Auto-Play Diagnostic', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    // Capture console messages
    page.on('console', msg => {
      if (msg.text().includes('🎥') || msg.text().includes('DEBUG')) {
        console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
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

  test('DIAGNOSTIC: Track video state during movement transition', async () => {
    console.log('\n========================================');
    console.log('🔍 STARTING DIAGNOSTIC TEST');
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

    // Find first movement with video
    // NOTE: Not all movements have video_url populated in database (25/35 have videos)
    // The AI may generate a class with movements that don't have videos yet
    console.log('[STEP 4] Waiting for first movement with video...');
    console.log('   NOTE: This test REQUIRES movements with video_url in database');
    console.log('   If class has no videos, test will fail (expected - videos not yet uploaded)');

    let foundVideoMovement = false;
    let attempts = 0;
    const maxAttempts = 15;  // Increased from 10 to 15 to check more movements

    while (!foundVideoMovement && attempts < maxAttempts) {
      const video = page.locator('video').first();
      const videoExists = await video.count() > 0;

      if (videoExists) {
        const videoSrc = await video.getAttribute('src');
        console.log(`   ✅ Video element found with src: ${videoSrc}`);
        foundVideoMovement = true;
      } else {
        // Check if "Video coming soon" badge is visible
        const comingSoonBadge = await page.locator('text=Video coming soon').isVisible();
        if (comingSoonBadge) {
          console.log(`   ⏭️  Current movement has no video (Video coming soon badge shown) - skipping...`);
        } else {
          console.log(`   ⏳ No video element yet (attempt ${attempts + 1}/${maxAttempts})`);
        }

        const nextButton = page.locator('[aria-label="Next movement"]');
        if (await nextButton.isVisible()) {
          await nextButton.click();
          await page.waitForTimeout(2000);
        } else {
          console.log('   ❌ Next button not visible - reached end of class');
          break;
        }
        attempts++;
      }
    }

    if (!foundVideoMovement) {
      console.log('❌ DIAGNOSTIC RESULT: Could not find movement with video after checking 15 movements');
      console.log('   This likely means:');
      console.log('   1. AI-generated class contains only movements without video_url in database');
      console.log('   2. Currently only 25/35 movements have videos uploaded');
      console.log('   3. Test requires manual class creation with known video movements');
      console.log('');
      console.log('📊 DATABASE STATUS:');
      console.log('   - Movements WITH videos: 25/35 (e.g., The Hundred, The Saw, Swan Dive)');
      console.log('   - Movements WITHOUT videos: 10/35 (e.g., Side bend, Teaser, etc.)');
      console.log('');
      console.log('🔧 TO FIX: Either:');
      console.log('   A) Manually create class with movements that have videos');
      console.log('   B) Upload more movement videos to AWS S3 and update database');
      console.log('   C) Modify sequence generation to prefer movements with videos');

      // Don't fail the test - just skip it since this is expected until more videos are uploaded
      console.log('');
      console.log('⏭️  SKIPPING auto-play test (no videos found in generated class)');
      return;
    }

    console.log('✅ Found movement with video!');

    // Capture initial state
    console.log('\n[STEP 5] Capturing initial video state...');
    const video = page.locator('video').first();
    const initialState = await video.evaluate((vid: HTMLVideoElement) => ({
      paused: vid.paused,
      currentTime: vid.currentTime,
      readyState: vid.readyState,
      networkState: vid.networkState,
      error: vid.error ? vid.error.message : null,
      src: vid.src,
      currentSrc: vid.currentSrc
    }));
    console.log('📹 Initial state:', JSON.stringify(initialState, null, 2));

    // Take screenshot before transition
    await page.screenshot({ path: 'screenshots/diagnostic-01-before-transition.png', fullPage: true });
    console.log('📸 Screenshot saved: diagnostic-01-before-transition.png');

    // Click Next movement button
    console.log('\n[STEP 6] Clicking "Next movement" button...');
    const nextButton = page.locator('[aria-label="Next movement"]');
    await nextButton.click();
    console.log('✅ Next button clicked at:', new Date().toISOString());

    // Log video state every 500ms for 10 seconds
    console.log('\n[STEP 7] Monitoring video state for 10 seconds (sampling every 500ms)...');
    console.log('─'.repeat(80));

    const monitoringResults: any[] = [];
    for (let i = 0; i <= 20; i++) {
      const elapsed = i * 0.5;

      const state = await video.evaluate((vid: HTMLVideoElement) => ({
        time: performance.now(),
        paused: vid.paused,
        currentTime: vid.currentTime,
        readyState: vid.readyState,
        networkState: vid.networkState,
        error: vid.error ? vid.error.message : null,
        src: vid.src,
        videoWidth: vid.videoWidth,
        videoHeight: vid.videoHeight
      }));

      monitoringResults.push({ elapsed, ...state });

      const readyStateNames = ['HAVE_NOTHING', 'HAVE_METADATA', 'HAVE_CURRENT_DATA', 'HAVE_FUTURE_DATA', 'HAVE_ENOUGH_DATA'];
      const readyStateName = readyStateNames[state.readyState] || 'UNKNOWN';

      console.log(
        `[${elapsed.toFixed(1)}s] ` +
        `paused=${state.paused} | ` +
        `time=${state.currentTime.toFixed(2)}s | ` +
        `ready=${readyStateName} | ` +
        `error=${state.error || 'none'}`
      );

      // Take screenshots at key moments
      if (i === 0) {
        await page.screenshot({ path: 'screenshots/diagnostic-02-immediately-after-click.png', fullPage: true });
        console.log('   📸 Screenshot: diagnostic-02-immediately-after-click.png');
      }
      if (elapsed === 2.0) {
        await page.screenshot({ path: 'screenshots/diagnostic-03-after-2s.png', fullPage: true });
        console.log('   📸 Screenshot: diagnostic-03-after-2s.png');
      }
      if (elapsed === 4.0) {
        await page.screenshot({ path: 'screenshots/diagnostic-04-after-4s.png', fullPage: true });
        console.log('   📸 Screenshot: diagnostic-04-after-4s.png');
      }
      if (elapsed === 6.0) {
        await page.screenshot({ path: 'screenshots/diagnostic-05-after-6s.png', fullPage: true });
        console.log('   📸 Screenshot: diagnostic-05-after-6s.png');
      }

      await page.waitForTimeout(500);
    }

    console.log('─'.repeat(80));

    // Analysis
    console.log('\n[STEP 8] DIAGNOSTIC ANALYSIS:');
    console.log('─'.repeat(80));

    const videoStartedPlaying = monitoringResults.some(r => !r.paused && r.currentTime > 0);
    const whenStarted = monitoringResults.find(r => !r.paused && r.currentTime > 0);
    const videoNeverBecameReady = monitoringResults.every(r => r.readyState < 3);
    const videoHadError = monitoringResults.some(r => r.error !== null);

    console.log(`✓ Video auto-played: ${videoStartedPlaying ? 'YES ✅' : 'NO ❌'}`);
    if (videoStartedPlaying && whenStarted) {
      console.log(`✓ Started playing at: ${whenStarted.elapsed}s after transition`);
      console.log(`✓ Playing at currentTime: ${whenStarted.currentTime.toFixed(2)}s`);
    } else {
      console.log(`✗ Video remained paused throughout 10-second observation period`);
    }

    console.log(`✓ Video became ready (readyState >= 3): ${!videoNeverBecameReady ? 'YES' : 'NO'}`);
    console.log(`✓ Video had errors: ${videoHadError ? 'YES' : 'NO'}`);

    if (videoHadError) {
      const errorState = monitoringResults.find(r => r.error !== null);
      console.log(`  Error message: ${errorState?.error}`);
    }

    // Check for loading indicator
    const loadingIndicatorAppeared = await page.locator('text=Video loading').count() > 0;
    console.log(`✓ Loading indicator appeared: ${loadingIndicatorAppeared ? 'YES' : 'NO'}`);

    console.log('─'.repeat(80));
    console.log('\n[DIAGNOSTIC COMPLETE]');
    console.log('Check screenshots/ directory for visual evidence');
    console.log('Check browser console logs above for useEffect triggers');
    console.log('========================================\n');

    // Fail the test if video didn't auto-play (this is expected - we're diagnosing WHY)
    expect(videoStartedPlaying).toBeTruthy();
  });
});
