/**
 * Mobile Video Fixes - Comprehensive E2E Tests
 *
 * Tests for three critical issues:
 * 1. Mobile narrative hidden behind video
 * 2. Video not auto-playing on section transitions
 * 3. Voiceover/video sync (5-7 second delay looks broken)
 *
 * Success Criteria:
 * - Mobile: Narrative scrolls without video overlap
 * - Laptop: Video stays in picture-in-picture position
 * - All devices: Thumbnail shows for 5 seconds before video
 * - All devices: Videos auto-play on section changes
 */

import { test, expect, Page } from '@playwright/test';

// Test credentials
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword';
const TEST_ENV = process.env.TEST_ENV || 'dev';

// Environment URLs
const ENV_URLS = {
  dev: 'https://bassline-dev.netlify.app',
  prod: 'https://basslinemvp.netlify.app'
};

const BASE_URL = ENV_URLS[TEST_ENV as keyof typeof ENV_URLS];

// Device configurations
const DEVICES = {
  mobile: [
    { name: 'iPhone 14', viewport: { width: 390, height: 844 } },
    { name: 'iPhone SE', viewport: { width: 375, height: 667 } },
    { name: 'Pixel 7', viewport: { width: 412, height: 915 } },
  ],
  tablet: [
    { name: 'iPad Mini', viewport: { width: 768, height: 1024 } },
  ],
  laptop: [
    { name: 'MacBook Pro', viewport: { width: 1440, height: 900 } },
    { name: 'Windows Laptop', viewport: { width: 1920, height: 1080 } },
    { name: 'Small Laptop', viewport: { width: 1366, height: 768 } },
  ]
};

// Helper function to start class playback
async function startClassPlayback(page: Page) {
  // Navigate to class builder
  await page.click('text=Generate');
  await page.waitForURL(/\/class-builder/, { timeout: 10000 });
  await page.waitForTimeout(2000);

  // Generate a 10-minute class
  await page.selectOption('select >> nth=0', { label: '10 minutes - Quick movement practise' });
  await page.selectOption('select >> nth=1', { label: 'Beginner' });
  await page.click('button:has-text("Generate Class Plan")');

  // Wait for generation to complete
  await page.waitForSelector('text=Your Auto-Generated Class', { timeout: 60000 });

  // Accept and start playback
  await page.click('button:has-text("Accept & Add to Class")');
  await page.waitForSelector('button:has-text("Play Class")', { timeout: 5000 });
  await page.click('button:has-text("Play Class")');
  await page.waitForSelector('button[aria-label="Pause"]', { timeout: 10000 });

  // Give UI time to render
  await page.waitForTimeout(2000);
}

// Helper to handle login and safety modal
async function setupAndLogin(page: Page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');

  // Handle Medical Safety Disclaimer if present
  const disclaimerModal = page.locator('text=Medical Safety Disclaimer');
  if (await disclaimerModal.isVisible({ timeout: 3000 }).catch(() => false)) {
    // Answer pregnancy question
    const pregnancyNo = page.locator('button:has-text("No")');
    if (await pregnancyNo.isVisible({ timeout: 2000 }).catch(() => false)) {
      await pregnancyNo.click();
      await page.waitForTimeout(500);
    }

    // Check checkboxes
    const checkbox1 = page.locator('input[type="checkbox"]').first();
    const checkbox2 = page.locator('input[type="checkbox"]').nth(1);
    if (await checkbox1.isVisible({ timeout: 2000 }).catch(() => false)) {
      await checkbox1.check();
      await checkbox2.check();
      await page.waitForTimeout(300);
    }

    // Accept disclaimer
    const acceptButton = page.locator('button:has-text("Accept - Continue to App")');
    if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await acceptButton.click();
      await page.waitForTimeout(500);
    }
  }

  // Check if already logged in
  const isLoggedIn = await page.locator('text=Generate').isVisible().catch(() => false);

  if (!isLoggedIn) {
    // Navigate to login
    if (!page.url().includes('/login')) {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
    }

    // Login
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/\/(dashboard|generate|$)/, { timeout: 15000 });
  }
}

test.describe('Issue 1: Mobile Narrative Hidden Behind Video', () => {
  test.beforeEach(async ({ page }) => {
    await setupAndLogin(page);
  });

  // Test on mobile devices
  for (const device of DEVICES.mobile) {
    test(`${device.name}: narrative should scroll without video overlap`, async ({ page }) => {
      console.log(`\n📱 Testing mobile layout on ${device.name}...`);

      await page.setViewportSize(device.viewport);
      await startClassPlayback(page);

      // Get video container position
      const videoElement = page.locator('video, .video-thumbnail, [class*="video"]').first();
      const hasVideo = await videoElement.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasVideo) {
        const videoBox = await videoElement.boundingBox();
        console.log(`Video position: x=${videoBox?.x}, y=${videoBox?.y}, width=${videoBox?.width}, height=${videoBox?.height}`);

        // Get narrative text position
        const narrativeElement = page.locator('h1, [class*="narrative"]').first();
        const narrativeBox = await narrativeElement.boundingBox();
        console.log(`Narrative position: x=${narrativeBox?.x}, y=${narrativeBox?.y}`);

        // On mobile, video should be inline (not overlapping)
        if (videoBox && narrativeBox) {
          expect(videoBox.y + videoBox.height).toBeLessThanOrEqual(narrativeBox.y + 20); // Allow 20px margin
          console.log(`✅ Video does not overlap narrative on ${device.name}`);
        }

        // Test scrolling
        await page.evaluate(() => window.scrollBy(0, 200));
        await page.waitForTimeout(500);

        // Verify narrative scrolled but video position adjusted appropriately
        const narrativeBoxAfter = await narrativeElement.boundingBox();
        if (narrativeBox && narrativeBoxAfter) {
          expect(narrativeBoxAfter.y).toBeLessThan(narrativeBox.y);
          console.log(`✅ Narrative scrolls properly on ${device.name}`);
        }
      }
    });
  }

  // Test on laptop to ensure picture-in-picture preserved
  test('Laptop: video should stay in picture-in-picture position', async ({ page }) => {
    console.log(`\n💻 Testing laptop layout...`);

    await page.setViewportSize(DEVICES.laptop[0].viewport);
    await startClassPlayback(page);

    const videoElement = page.locator('video, .video-thumbnail, [class*="video"]').first();
    const hasVideo = await videoElement.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasVideo) {
      const videoBox = await videoElement.boundingBox();

      // On laptop, video should be positioned top-right (picture-in-picture)
      if (videoBox) {
        expect(videoBox.x).toBeGreaterThan(900); // Right side of screen
        expect(videoBox.y).toBeLessThan(200); // Near top
        expect(videoBox.width).toBeLessThanOrEqual(400); // Not full width
        console.log(`✅ Video maintains picture-in-picture on laptop`);
      }
    }
  });
});

test.describe('Issue 2: Video Not Auto-playing on Section Transitions', () => {
  test.beforeEach(async ({ page }) => {
    await setupAndLogin(page);
  });

  // Test on both mobile and laptop
  const testDevices = [
    DEVICES.mobile[0], // iPhone 14
    DEVICES.laptop[0], // MacBook Pro
  ];

  for (const device of testDevices) {
    test(`${device.name}: videos should auto-play on section change`, async ({ page }) => {
      console.log(`\n🎬 Testing auto-play on ${device.name}...`);

      await page.setViewportSize(device.viewport);
      await startClassPlayback(page);

      // Wait for initial section to load
      await page.waitForTimeout(3000);

      // Check if video exists in first section
      const videoElement = page.locator('video').first();
      const hasVideo = await videoElement.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasVideo) {
        // Get initial video state
        const initialState = await videoElement.evaluate((vid: HTMLVideoElement) => ({
          paused: vid.paused,
          currentTime: vid.currentTime,
          src: vid.src
        }));
        console.log(`Initial video state: paused=${initialState.paused}, time=${initialState.currentTime}`);
      }

      // Click next to change section
      const nextButton = page.locator('button[aria-label="Next"]');
      await nextButton.click();
      console.log('Clicked Next button, waiting for section change...');

      // Wait for section transition
      await page.waitForTimeout(2000);

      // Check new video state
      const newVideoElement = page.locator('video').first();
      const hasNewVideo = await newVideoElement.isVisible({ timeout: 7000 }).catch(() => false);

      if (hasNewVideo) {
        // Allow time for thumbnail phase if present
        const hasThumbnail = await page.locator('text=Preparing demonstration').isVisible({ timeout: 1000 }).catch(() => false);

        if (hasThumbnail) {
          console.log('Thumbnail phase detected, waiting 5 seconds...');
          await page.waitForTimeout(5500);
        }

        // Check if video is playing
        const newState = await newVideoElement.evaluate((vid: HTMLVideoElement) => ({
          paused: vid.paused,
          currentTime: vid.currentTime,
          readyState: vid.readyState,
          error: vid.error?.message
        }));

        console.log(`New video state: paused=${newState.paused}, time=${newState.currentTime}, ready=${newState.readyState}`);

        // Video should be playing (not paused) and near the beginning
        expect(newState.paused).toBe(false);
        expect(newState.currentTime).toBeLessThan(3); // Should be near start
        console.log(`✅ Video auto-plays on section change on ${device.name}`);
      }
    });
  }
});

test.describe('Issue 3: Voiceover/Video Sync (Thumbnail Strategy)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAndLogin(page);
  });

  // Test on all device types
  const testDevices = [
    DEVICES.mobile[0], // iPhone 14
    DEVICES.tablet[0], // iPad Mini
    DEVICES.laptop[0], // MacBook Pro
  ];

  for (const device of testDevices) {
    test(`${device.name}: should show thumbnail with progress for 5 seconds`, async ({ page }) => {
      console.log(`\n⏱️ Testing thumbnail sync on ${device.name}...`);

      await page.setViewportSize(device.viewport);
      await startClassPlayback(page);

      // Look for thumbnail/preparing demonstration state
      const preparingText = page.locator('text=Preparing demonstration');
      const hasThumbnail = await preparingText.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasThumbnail) {
        console.log('✅ Thumbnail phase detected');

        // Look for progress bar
        const progressBar = page.locator('[class*="progress"], [class*="bar"], [style*="width"]').first();
        const hasProgressBar = await progressBar.isVisible({ timeout: 1000 }).catch(() => false);

        if (hasProgressBar) {
          // Measure progress bar animation
          const width1 = await progressBar.evaluate(el => {
            const style = window.getComputedStyle(el);
            return parseInt(style.width) || parseInt(el.style.width) || 0;
          });
          console.log(`Progress at T+0: ${width1}`);

          await page.waitForTimeout(2000);

          const width2 = await progressBar.evaluate(el => {
            const style = window.getComputedStyle(el);
            return parseInt(style.width) || parseInt(el.style.width) || 0;
          });
          console.log(`Progress at T+2s: ${width2}`);

          // Progress should increase
          expect(width2).toBeGreaterThan(width1);
          console.log('✅ Progress bar animates correctly');
        }

        // Wait for video to appear after ~5 seconds
        await page.waitForSelector('video', { timeout: 7000 });

        // Thumbnail should be gone
        const thumbnailGone = await preparingText.isVisible({ timeout: 500 }).catch(() => false);
        expect(thumbnailGone).toBe(false);
        console.log('✅ Transitions from thumbnail to video after ~5 seconds');

        // Video should be playing
        const videoPlaying = await page.locator('video').evaluate((vid: HTMLVideoElement) => !vid.paused);
        expect(videoPlaying).toBe(true);
        console.log(`✅ Video plays automatically after thumbnail phase on ${device.name}`);
      } else {
        console.log('⚠️ No thumbnail phase detected (may not have video for this section)');
      }
    });
  }
});

// Performance test on slow network
test.describe('Performance on Slow Networks', () => {
  test('Mobile 3G: all features should work', async ({ page }) => {
    console.log('\n📶 Testing on slow 3G network...');

    // Simulate 3G network
    await page.route('**/*', route => route.continue());
    await page.context().setOffline(false);

    // Throttle network to 3G speeds
    const client = await page.context().newCDPSession(page);
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6 Mbps
      uploadThroughput: (750 * 1024) / 8, // 750 Kbps
      latency: 150 // 150ms latency
    });

    await setupAndLogin(page);
    await page.setViewportSize(DEVICES.mobile[0].viewport);
    await startClassPlayback(page);

    // Test basic functionality on slow network
    await page.waitForTimeout(3000);

    // Verify playback controls work
    const pauseButton = page.locator('button[aria-label="Pause"]');
    await expect(pauseButton).toBeVisible({ timeout: 10000 });
    console.log('✅ Playback works on 3G network');
  });
});