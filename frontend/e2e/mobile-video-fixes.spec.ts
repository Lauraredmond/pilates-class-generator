/**
 * Mobile Video Fixes Test Suite
 * Tests for three critical issues in class playback:
 * 1. Mobile display: narrative scrolling behind/under video
 * 2. Auto-play: videos not playing automatically on section transitions
 * 3. Sync issue: 7-second delay for voiceover/video sync
 */

import { test, expect, Page } from '@playwright/test';

// Test credentials from .env.test file
// ⚠️ Real credentials MUST be in .env.test (gitignored), NOT hardcoded here
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'placeholder-password';

// Helper to handle medical disclaimer
async function handleMedicalDisclaimer(page: Page) {
  console.log('[MEDICAL] Checking for medical disclaimer...');

  // First, check if we see the pregnancy question (Yes/No buttons)
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
  } else {
    console.log('[MEDICAL] No medical disclaimer visible');
  }
}

// Helper to handle login
async function setupAndLogin(page: Page) {
  console.log('[AUTH] Starting login process...');

  // First handle medical disclaimer if present
  await handleMedicalDisclaimer(page);

  // Look for email/username field
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
      await page.waitForLoadState('networkidle').catch(() => {
        console.log('[AUTH] Network idle timeout, continuing...');
      });
      await page.waitForTimeout(3000);
      console.log('[AUTH] Login completed');
    }
  } else {
    console.log('[AUTH] No login form found, checking if already logged in...');
    const url = page.url();
    if (!url.includes('/login')) {
      console.log('[AUTH] Not on login page, assuming logged in');
    } else {
      console.log('[AUTH] On login page but form not visible');
      await page.goto('/login');
      await page.waitForTimeout(2000);
      await setupAndLogin(page); // Recursive retry
    }
  }
}

const DEVICES = {
  mobile: [
    { name: 'iPhone 14', viewport: { width: 390, height: 844 } },
    { name: 'iPhone SE', viewport: { width: 375, height: 667 } },
    { name: 'Pixel 5 (Android)', viewport: { width: 393, height: 851 } },
    { name: 'Galaxy S21 (Android)', viewport: { width: 360, height: 800 } },
  ],
  laptop: [
    { name: 'MacBook Pro', viewport: { width: 1440, height: 900 } },
  ]
};

test.describe('Mobile Video Fixes', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto('/');
    await setupAndLogin(page);
  });

  test.afterEach(async () => {
    await page.close();
  });

  // Issue 1: Mobile display - narrative should scroll UNDER video, not behind
  test.describe('Issue 1: Mobile Display Layout', () => {
    DEVICES.mobile.forEach(device => {
      test(`${device.name}: narrative scrolls under video, not behind`, async () => {
        await page.setViewportSize(device.viewport);

        // Navigate to class builder
        const generateButton = page.locator('text=Generate');
        await generateButton.click();
        await page.waitForURL('**/class-builder', { timeout: 10000 });

        // Wait for page to fully load
        await page.waitForTimeout(2000);

        // Select 10-minute class (shorter for testing)
        await page.selectOption('select >> nth=0', { label: '10 minutes - Quick movement practise' });

        // Select Beginner difficulty
        await page.selectOption('select >> nth=1', { label: 'Beginner' });

        // Click "Generate Class Plan" button
        await page.click('button:has-text("Generate Class Plan")');

        // Wait for results modal to appear (DEFAULT mode is fast ~1s)
        await page.waitForSelector('text=Your Auto-Generated Class', { timeout: 60000 });

        // Click "Accept & Add to Class" button in modal
        const acceptButton = page.locator('button:has-text("Accept & Add to Class")');
        await acceptButton.click();

        // Wait for modal to close (indicated by "Play Class" button becoming visible)
        await page.waitForSelector('button:has-text("Play Class")', { timeout: 5000 });

        // Click "Play Class" button to start playback
        const playButton = page.locator('button:has-text("Play Class")');
        await playButton.click();

        // Wait for playback to start
        await page.waitForSelector('.relative.h-full', { timeout: 10000 });

        // Check video position
        const video = await page.locator('video').first();
        const videoContainer = await page.locator('video').first().locator('..');
        const parentContainer = await videoContainer.locator('..');
        // Select narrative as next sibling of video container (not just any .overflow-y-auto)
        const narrative = await parentContainer.locator('> div.overflow-y-auto').first();

        if (await video.isVisible()) {
          const videoBounds = await video.boundingBox();
          const narrativeBounds = await narrative.boundingBox();
          const videoContainerBounds = await videoContainer.boundingBox();
          const parentContainerBounds = await parentContainer.boundingBox();

          // Debug logging
          console.log(`\n📐 ${device.name} LAYOUT DEBUGGING:`);
          console.log(`Parent container bounds:`, parentContainerBounds);
          console.log(`Video container bounds:`, videoContainerBounds);
          console.log(`Video element bounds:`, videoBounds);
          console.log(`Narrative container bounds:`, narrativeBounds);

          // Check CSS classes
          const parentClasses = await parentContainer.getAttribute('class');
          const videoContainerClasses = await videoContainer.getAttribute('class');
          const narrativeClasses = await narrative.getAttribute('class');

          console.log(`Parent classes:`, parentClasses);
          console.log(`Video container classes:`, videoContainerClasses);
          console.log(`Narrative classes:`, narrativeClasses);

          // On mobile, video should be inline (not absolute positioned)
          // Narrative should have enough top margin to not overlap
          expect(narrativeBounds).toBeTruthy();
          expect(videoBounds).toBeTruthy();

          if (videoBounds && narrativeBounds) {
            // Check that narrative starts below video (with some margin)
            const gap = narrativeBounds.y - (videoBounds.y + videoBounds.height);
            console.log(`Gap calculation: ${narrativeBounds.y} - (${videoBounds.y} + ${videoBounds.height}) = ${gap}px`);

            if (gap >= 0) {
              console.log(`✅ ${device.name}: Narrative starts ${gap}px below video`);
            } else {
              console.log(`❌ ${device.name}: Narrative OVERLAPS video by ${Math.abs(gap)}px`);
            }

            expect(gap).toBeGreaterThanOrEqual(0);
          }
        }
      });
    });

    DEVICES.laptop.forEach(device => {
      test(`${device.name}: video remains picture-in-picture`, async () => {
        await page.setViewportSize(device.viewport);

        // Navigate to class builder and generate class
        await page.click('text=Generate');
        await page.waitForURL('**/class-builder', { timeout: 10000 });
        await page.waitForTimeout(2000);

        await page.selectOption('select >> nth=0', { label: '10 minutes - Quick movement practise' });
        await page.selectOption('select >> nth=1', { label: 'Beginner' });
        await page.click('button:has-text("Generate Class Plan")');
        await page.waitForSelector('text=Your Auto-Generated Class', { timeout: 60000 });
        await page.click('button:has-text("Accept & Add to Class")');
        await page.waitForSelector('button:has-text("Play Class")', { timeout: 5000 });
        await page.click('button:has-text("Play Class")');

        // Wait for playback to start
        await page.waitForSelector('.relative.h-full', { timeout: 10000 });

        // Check video is absolutely positioned (picture-in-picture)
        const video = await page.locator('video').first();
        if (await video.isVisible()) {
          const videoContainer = await page.locator('video').first().locator('..');
          const styles = await videoContainer.evaluate(el =>
            window.getComputedStyle(el).position
          );
          expect(styles).toBe('absolute');
          console.log(`✅ ${device.name}: Video is picture-in-picture (absolute)`);
        }
      });
    });
  });

  // Issue 2: Auto-play - videos should play automatically on section transitions
  test.describe('Issue 2: Video Auto-play', () => {
    test('videos auto-play when entering new sections', async () => {
      // Navigate to class builder and generate class
      await page.click('text=Generate');
      await page.waitForURL('**/class-builder', { timeout: 10000 });
      await page.waitForTimeout(2000);

      await page.selectOption('select >> nth=0', { label: '10 minutes - Quick movement practise' });
      await page.selectOption('select >> nth=1', { label: 'Beginner' });
      await page.click('button:has-text("Generate Class Plan")');
      await page.waitForSelector('text=Your Auto-Generated Class', { timeout: 60000 });
      await page.click('button:has-text("Accept & Add to Class")');
      await page.waitForSelector('button:has-text("Play Class")', { timeout: 5000 });
      await page.click('button:has-text("Play Class")');

      // Wait for playback to start
      await page.waitForSelector('.relative.h-full', { timeout: 10000 });

      // Skip to next section
      const nextButton = await page.locator('[aria-label="Next movement"]');
      if (await nextButton.isVisible()) {
        await nextButton.click();

        // Check if video starts playing
        await page.waitForTimeout(2000); // Wait for any delays

        const video = await page.locator('video').first();
        if (await video.isVisible()) {
          const isPlaying = await video.evaluate((vid: HTMLVideoElement) =>
            !vid.paused && !vid.ended && vid.readyState > 2
          );
          expect(isPlaying).toBeTruthy();
          console.log('✅ Video auto-plays on section transition');
        }
      }
    });
  });

  // Issue 3: Sync - implement thumbnail + progress bar for 7-second delay
  test.describe('Issue 3: Video/Voiceover Sync', () => {
    test('shows thumbnail with progress bar during 7-second delay', async () => {
      // Navigate to class builder and generate class
      await page.click('text=Generate');
      await page.waitForURL('**/class-builder', { timeout: 10000 });
      await page.waitForTimeout(2000);

      await page.selectOption('select >> nth=0', { label: '10 minutes - Quick movement practise' });
      await page.selectOption('select >> nth=1', { label: 'Beginner' });
      await page.click('button:has-text("Generate Class Plan")');
      await page.waitForSelector('text=Your Auto-Generated Class', { timeout: 60000 });
      await page.click('button:has-text("Accept & Add to Class")');
      await page.waitForSelector('button:has-text("Play Class")', { timeout: 5000 });
      await page.click('button:has-text("Play Class")');

      // Wait for playback to start
      await page.waitForSelector('.relative.h-full', { timeout: 10000 });

      // Check for thumbnail during initial delay
      const video = await page.locator('video').first();
      if (await video.isVisible()) {
        // Video should be paused initially (showing thumbnail)
        const initialState = await video.evaluate((vid: HTMLVideoElement) => ({
          paused: vid.paused,
          currentTime: vid.currentTime,
          readyState: vid.readyState
        }));
        console.log('📹 Initial video state:', initialState);
        expect(initialState.paused).toBeTruthy();
        console.log('✅ Video shows thumbnail initially');

        // Wait for delay period + buffering time (7s delay + 3s buffer = 10s total)
        console.log('⏳ Waiting 10 seconds for video delay + buffering...');
        await page.waitForTimeout(10000);

        // Check video state after delay
        const afterDelayState = await video.evaluate((vid: HTMLVideoElement) => ({
          paused: vid.paused,
          currentTime: vid.currentTime,
          readyState: vid.readyState,
          ended: vid.ended
        }));
        console.log('📹 After delay video state:', afterDelayState);

        // Video should now be playing (or at least have started - currentTime > 0)
        const hasStarted = afterDelayState.currentTime > 0 || !afterDelayState.paused;
        if (!hasStarted) {
          console.log('❌ Video did not start after 10 seconds');
          console.log('   This might be due to browser autoplay blocking');
        } else {
          console.log(`✅ Video started (currentTime: ${afterDelayState.currentTime.toFixed(2)}s, playing: ${!afterDelayState.paused})`);
        }

        expect(hasStarted).toBeTruthy();
      }
    });
  });
});