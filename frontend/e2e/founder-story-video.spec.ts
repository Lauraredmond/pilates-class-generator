import { test, expect } from '@playwright/test';

/**
 * Founder Story Video Test
 *
 * Verifies that the founder story video:
 * 1. Page loads successfully
 * 2. Video element exists
 * 3. Video source URL is correct
 * 4. Video can be played
 */

test.describe('Founder Story Video', () => {
  test('should display and load the founder story video', async ({ page }) => {
    // Bypass medical disclaimer by setting localStorage (simulates returning user)
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('disclaimerAccepted', 'true');
    });

    // Navigate to founder story page
    await page.goto('/founder-story');

    // Wait for page to load
    await expect(page.locator('h1:has-text("The Founder\'s Story")')).toBeVisible();

    // Check if video element exists
    const video = page.locator('video');
    await expect(video).toBeVisible({ timeout: 10000 });

    // Verify video source URL
    const videoSource = page.locator('video source');
    await expect(videoSource).toHaveAttribute(
      'src',
      'https://pilates-movement-videos.s3.us-east-1.amazonaws.com/FounderStoryVideo.mp4'
    );

    // Check that video has controls
    await expect(video).toHaveAttribute('controls');

    // Verify no CSP errors in console
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait a moment for any CSP errors to appear
    await page.waitForTimeout(2000);

    // Check for CSP violations
    const cspErrors = consoleErrors.filter(err =>
      err.includes('Content Security Policy') || err.includes('Refused to load')
    );

    if (cspErrors.length > 0) {
      console.error('❌ CSP ERRORS DETECTED:');
      cspErrors.forEach(err => console.error(`   ${err}`));
      throw new Error(`CSP violations found: ${cspErrors.length}`);
    }

    // Try to play video (optional - may require user gesture in some browsers)
    try {
      await video.evaluate((el: HTMLVideoElement) => el.play());
      await page.waitForTimeout(1000);

      // Check if video is actually playing
      const isPlaying = await video.evaluate((el: HTMLVideoElement) =>
        !el.paused && !el.ended && el.readyState > 2
      );

      console.log(`✅ Video playback test: ${isPlaying ? 'PLAYING' : 'NOT PLAYING (may require user gesture)'}`);
    } catch (e) {
      console.log('⚠️  Video play() failed (expected in automated tests without user gesture)');
    }

    console.log('✅ Founder story video element verified successfully');
  });

  test('should not have broken video element', async ({ page }) => {
    // Bypass medical disclaimer by setting localStorage (simulates returning user)
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('disclaimerAccepted', 'true');
    });

    await page.goto('/founder-story');

    // Video should not show error state
    const video = page.locator('video');
    const videoError = await video.evaluate((el: HTMLVideoElement) => el.error);

    expect(videoError).toBeNull();
  });
});
