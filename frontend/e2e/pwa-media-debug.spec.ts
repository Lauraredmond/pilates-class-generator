import { test, expect, Page } from '@playwright/test';

// Test credentials
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword';

// Helper to capture and log all console messages
function setupConsoleLogging(page: Page) {
  const logs: string[] = [];

  page.on('console', msg => {
    const logMessage = `[${msg.type().toUpperCase()}] ${msg.text()}`;
    console.log(logMessage);
    logs.push(logMessage);
  });

  page.on('pageerror', err => {
    const errorMessage = `[PAGE ERROR] ${err.message}`;
    console.log(errorMessage);
    logs.push(errorMessage);
  });

  // Log media-related network requests
  page.on('response', response => {
    const url = response.url();
    if (url.match(/\.(mp4|mp3|webm|ogg|wav|m4a|m3u8)/i)) {
      const logMessage = `[MEDIA REQUEST] ${response.status()} ${url}`;
      console.log(logMessage);
      logs.push(logMessage);
    }
  });

  // Log failed requests
  page.on('requestfailed', request => {
    const url = request.url();
    const logMessage = `[REQUEST FAILED] ${request.failure()?.errorText} - ${url}`;
    console.log(logMessage);
    logs.push(logMessage);
  });

  return logs;
}

// Helper to handle medical disclaimer (pregnancy question + disclaimer acceptance)
async function handleMedicalDisclaimer(page: Page) {
  console.log('[MEDICAL] Checking for medical disclaimer...');

  // First, check if we see the pregnancy question (Yes/No buttons)
  const yesButton = page.locator('button:has-text("Yes")').first();
  const noButton = page.locator('button:has-text("No")').first();

  if (await yesButton.isVisible() && await noButton.isVisible()) {
    console.log('[MEDICAL] Found pregnancy question, answering "No"...');

    // Click "No" to indicate not pregnant
    await noButton.click();
    await page.waitForTimeout(1000);

    // Now we should see the full medical disclaimer with checkboxes
    console.log('[MEDICAL] Looking for disclaimer checkboxes...');

    // Check all checkboxes
    const checkboxes = await page.locator('input[type="checkbox"]').all();
    if (checkboxes.length > 0) {
      console.log(`[MEDICAL] Found ${checkboxes.length} checkboxes, checking all...`);
      for (const checkbox of checkboxes) {
        if (await checkbox.isVisible() && !(await checkbox.isChecked())) {
          await checkbox.check();
          console.log('[MEDICAL] Checked a checkbox');
        }
      }
      await page.waitForTimeout(500);
    }

    // Now look for the Accept button
    const acceptButton = page.locator('button:has-text("Accept")').first();
    if (await acceptButton.isVisible()) {
      console.log('[MEDICAL] Clicking Accept button...');
      await acceptButton.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(2000);
    }

    // Also set localStorage to bypass it in future (mimics real user behavior)
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
async function login(page: Page) {
  console.log('[AUTH] Starting login process...');

  // First handle medical disclaimer if present
  await handleMedicalDisclaimer(page);

  // Look for email/username field
  const emailField = page.locator('input[type="email"], input[name*="email"], input[name*="user"], input[placeholder*="email"], input[id*="email"]').first();
  const passwordField = page.locator('input[type="password"], input[name*="password"], input[placeholder*="password"], input[id*="password"]').first();

  if (await emailField.isVisible() && await passwordField.isVisible()) {
    console.log('[AUTH] Found login form, filling credentials...');
    await emailField.fill(TEST_EMAIL);
    await passwordField.fill(TEST_PASSWORD);

    // Look for submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Sign In"), button:has-text("Login"), button:has-text("Log in"), button:has-text("Log In")').first();
    if (await submitButton.isVisible()) {
      console.log('[AUTH] Clicking submit button...');
      await submitButton.click();

      // Wait for navigation or loading to complete
      await page.waitForLoadState('networkidle').catch(() => {
        console.log('[AUTH] Network idle timeout, continuing...');
      });

      // Wait for successful login
      await page.waitForTimeout(3000);

      console.log('[AUTH] Login completed, verifying...');
      const postLoginUrl = page.url();
      console.log(`[AUTH] Post-login URL: ${postLoginUrl}`);
    }
  } else {
    console.log('[AUTH] No login form found');

    // Log current page info for debugging
    const url = page.url();
    const title = await page.title();
    console.log(`[AUTH] Current URL: ${url}`);
    console.log(`[AUTH] Current title: ${title}`);

    // Try navigating to login if we're not there
    if (!url.includes('/login')) {
      console.log('[AUTH] Attempting to navigate to /login...');
      await page.goto('/login');
      await page.waitForTimeout(2000);
      // Recursively try login again
      await login(page);
    }
  }
}

test.describe('Bassline PWA Media Debug Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Set up console logging for all tests
    setupConsoleLogging(page);

    // Set viewport to iPhone 12 size (PWA simulation)
    await page.setViewportSize({ width: 390, height: 844 });

    // Add user agent for iOS Safari (PWA simulation)
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'standalone', {
        get() { return true; } // Simulate iOS PWA standalone mode
      });
    });
  });

  test('Complete user journey with media interaction audit', async ({ page }) => {
    console.log('=== Starting Bassline PWA Media Debug ===');
    const issues: string[] = [];

    // Step 1: Navigate to home and login
    console.log('\n[STEP 1] Navigating to home page...');
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Handle medical disclaimer and login
    await handleMedicalDisclaimer(page);
    await login(page);

    // Check for any initial media elements
    const initialVideos = await page.locator('video').count();
    const initialAudios = await page.locator('audio').count();
    console.log(`Found ${initialVideos} video elements, ${initialAudios} audio elements on home page`);

    // Step 2: Look for main navigation or class generation button
    console.log('\n[STEP 2] Looking for main app navigation...');

    // Try different selectors for the main app entry point
    const possibleButtons = [
      page.getByRole('button', { name: /generate.*class/i }),
      page.getByText(/generate.*class/i),
      page.locator('button:has-text("Generate")'),
      page.locator('a:has-text("Generate")'),
      page.locator('button:has-text("Start")'),
      page.locator('button:has-text("Create")'),
      page.locator('button:has-text("Build")'),
      page.getByRole('link', { name: /class/i }),
      page.getByRole('button', { name: /pilates/i })
    ];

    let foundButton = false;
    for (const button of possibleButtons) {
      if (await button.isVisible()) {
        const text = await button.textContent();
        console.log(`Found button: "${text}", clicking...`);
        await button.click();
        foundButton = true;
        await page.waitForLoadState('networkidle');
        break;
      }
    }

    if (!foundButton) {
      // Log all visible buttons/links to understand the UI
      const allButtons = await page.locator('button, [role="button"], a').all();
      console.log('Available interactive elements:');
      for (const btn of allButtons) {
        if (await btn.isVisible()) {
          const text = await btn.textContent();
          console.log(`  - "${text?.trim()}"`);
        }
      }
      issues.push('Could not find class generation entry point');
    }

    // Step 3: Class Builder - select criteria
    console.log('\n[STEP 3] Looking for form elements to configure class...');
    await page.waitForTimeout(2000);

    const selects = await page.locator('select').all();
    const radioButtons = await page.locator('input[type="radio"]').all();
    const checkboxes = await page.locator('input[type="checkbox"]').all();
    const sliders = await page.locator('input[type="range"]').all();

    console.log(`Found ${selects.length} selects, ${radioButtons.length} radios, ${checkboxes.length} checkboxes, ${sliders.length} sliders`);

    // Fill out form elements if present
    if (selects.length > 0) {
      for (const select of selects.slice(0, 2)) {
        const options = await select.locator('option').all();
        if (options.length > 1) {
          await select.selectOption({ index: 1 });
          console.log('Selected an option in dropdown');
        }
      }
    }

    // Step 4: Generate class plan
    console.log('\n[STEP 4] Looking for Generate/Create button...');
    const createButton = page.getByRole('button', { name: /generate|create|build|start/i })
      .or(page.locator('button').filter({ hasText: /generate|create|build|start/i }));

    if (await createButton.isVisible()) {
      console.log('Clicking Generate/Create button...');
      await createButton.click();

      // Wait for response (may take time for AI generation)
      console.log('Waiting for class generation (up to 60s)...');
      await page.waitForResponse(response =>
        response.url().includes('/api/') && response.status() === 200,
        { timeout: 60000 }
      ).catch(err => {
        console.log(`API response timeout or error: ${err.message}`);
      });
    }

    // Step 5: Accept class plan
    console.log('\n[STEP 5] Looking for Accept/Play button...');
    await page.waitForTimeout(2000);

    // First, check if we need to accept the class plan
    const acceptButton = page.getByRole('button', { name: /Accept.*Add.*Class/i })
      .or(page.locator('button').filter({ hasText: /Accept.*Add/i }));

    if (await acceptButton.isVisible().catch(() => false)) {
      console.log('Found "Accept & Add to Class" button, clicking...');
      await acceptButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }

    // Now look for the Play button
    const playButton = page.getByRole('button', { name: /Play Class/i })
      .or(page.locator('button').filter({ hasText: /^Play/i }));

    if (await playButton.isVisible().catch(() => false)) {
      console.log('Found "Play Class" button, clicking...');
      await playButton.click();
      await page.waitForLoadState('networkidle');
    }

    // Step 6: Audit media elements during playback
    console.log('\n[STEP 6] Auditing media elements during playback...');
    await page.waitForTimeout(3000);

    // Comprehensive video audit
    const videos = await page.locator('video').all();
    console.log(`\n[VIDEO AUDIT] Found ${videos.length} video elements:`);

    for (let i = 0; i < videos.length; i++) {
      const videoState = await videos[i].evaluate((el: HTMLVideoElement, idx: number) => ({
        index: idx,
        src: el.src || el.currentSrc,
        poster: el.poster,
        readyState: el.readyState,
        readyStateText: ['HAVE_NOTHING', 'HAVE_METADATA', 'HAVE_CURRENT_DATA', 'HAVE_FUTURE_DATA', 'HAVE_ENOUGH_DATA'][el.readyState],
        networkState: el.networkState,
        networkStateText: ['NETWORK_EMPTY', 'NETWORK_IDLE', 'NETWORK_LOADING', 'NETWORK_NO_SOURCE'][el.networkState],
        error: el.error ? {
          code: el.error.code,
          message: el.error.message,
          codeText: ['', 'MEDIA_ERR_ABORTED', 'MEDIA_ERR_NETWORK', 'MEDIA_ERR_DECODE', 'MEDIA_ERR_SRC_NOT_SUPPORTED'][el.error.code]
        } : null,
        hasPlaysinline: el.hasAttribute('playsinline'),
        hasWebkitPlaysinline: el.hasAttribute('webkit-playsinline'),
        muted: el.muted,
        autoplay: el.autoplay,
        paused: el.paused,
        duration: el.duration,
        currentTime: el.currentTime
      }), i);

      console.log(`\nVideo ${i}:`, JSON.stringify(videoState, null, 2));

      if (videoState.error) {
        issues.push(`Video ${i} error: ${videoState.error.codeText}`);
      }
      if (!videoState.hasPlaysinline && !videoState.hasWebkitPlaysinline) {
        issues.push(`Video ${i} missing playsinline attributes`);
      }
    }

    // Comprehensive audio audit
    const audios = await page.locator('audio').all();
    console.log(`\n[AUDIO AUDIT] Found ${audios.length} audio elements:`);

    for (let i = 0; i < audios.length; i++) {
      const audioState = await audios[i].evaluate((el: HTMLAudioElement, idx: number) => ({
        index: idx,
        src: el.src || el.currentSrc,
        readyState: el.readyState,
        networkState: el.networkState,
        error: el.error ? {
          code: el.error.code,
          message: el.error.message
        } : null,
        muted: el.muted,
        autoplay: el.autoplay,
        paused: el.paused,
        duration: el.duration,
        currentTime: el.currentTime
      }), i);

      console.log(`\nAudio ${i}:`, JSON.stringify(audioState, null, 2));

      if (audioState.error) {
        issues.push(`Audio ${i} error: ${audioState.error.message}`);
      }
    }

    // Check AudioContext state
    const audioContextState = await page.evaluate(() => {
      // @ts-ignore
      if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
        // @ts-ignore
        const AC = window.AudioContext || window.webkitAudioContext;
        const ctx = new AC();
        return {
          state: ctx.state,
          sampleRate: ctx.sampleRate,
          baseLatency: ctx.baseLatency
        };
      }
      return null;
    });

    console.log('\n[AUDIO CONTEXT]:', audioContextState);
    if (audioContextState?.state === 'suspended') {
      issues.push('AudioContext is suspended - needs user interaction');
    }

    // Summary
    console.log('\n=== ISSUE SUMMARY ===');
    if (issues.length === 0) {
      console.log('✅ No issues detected');
    } else {
      console.log(`❌ Found ${issues.length} issues:`);
      issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue}`);
      });
    }

    // Take screenshot for debugging
    await page.screenshot({ path: 'media-debug-final-state.png', fullPage: true });
    console.log('Screenshot saved: media-debug-final-state.png');

    expect(true).toBe(true); // Always pass to see full audit
  });

  test('Test media playback with user gestures', async ({ page }) => {
    console.log('=== Testing Media Playback with Gestures ===');

    await page.goto('/');
    await handleMedicalDisclaimer(page);
    await login(page);
    await page.waitForTimeout(2000);

    // Add test button for user gesture simulation
    await page.evaluate(() => {
      const btn = document.createElement('button');
      btn.id = 'test-media-button';
      btn.textContent = 'Test Media Playback';
      btn.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999; padding: 10px; background: red; color: white;';
      document.body.appendChild(btn);

      btn.addEventListener('click', async () => {
        console.log('[TEST] User gesture triggered');

        // Test AudioContext
        // @ts-ignore
        const AC = window.AudioContext || window.webkitAudioContext;
        const ctx = new AC();
        console.log('[TEST] AudioContext state before resume:', ctx.state);

        if (ctx.state === 'suspended') {
          await ctx.resume();
          console.log('[TEST] AudioContext resumed, new state:', ctx.state);
        }

        // Test video playback with iOS-specific attributes
        const videos = document.querySelectorAll('video');
        videos.forEach(async (video, i) => {
          try {
            video.muted = true;
            video.setAttribute('playsinline', '');
            video.setAttribute('webkit-playsinline', '');
            video.setAttribute('x-webkit-airplay', 'allow');
            await video.play();
            console.log(`[TEST] Video ${i} playing successfully`);
          } catch (err) {
            console.error(`[TEST] Video ${i} play failed:`, err);
          }
        });

        // Test audio playback
        const audios = document.querySelectorAll('audio');
        audios.forEach(async (audio, i) => {
          try {
            await audio.play();
            console.log(`[TEST] Audio ${i} playing successfully`);
          } catch (err) {
            console.error(`[TEST] Audio ${i} play failed:`, err);
          }
        });
      });
    });

    await page.click('#test-media-button');
    await page.waitForTimeout(3000);

    console.log('Media playback test completed.');
  });

  test('Service Worker and caching audit', async ({ page }) => {
    console.log('=== Service Worker & Cache Audit ===');

    await page.goto('/');
    await handleMedicalDisclaimer(page);

    const swInfo = await page.evaluate(async () => {
      const info = {
        hasServiceWorker: 'serviceWorker' in navigator,
        registrations: [] as any[],
        caches: [] as string[],
        cacheContents: {} as Record<string, string[]>
      };

      if (info.hasServiceWorker) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        info.registrations = registrations.map(reg => ({
          scope: reg.scope,
          active: reg.active?.state,
          waiting: reg.waiting?.state,
          installing: reg.installing?.state,
          scriptURL: reg.active?.scriptURL || reg.waiting?.scriptURL || reg.installing?.scriptURL
        }));

        if ('caches' in window) {
          const cacheNames = await caches.keys();
          info.caches = cacheNames;

          for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();
            info.cacheContents[cacheName] = requests.map(r => r.url);
          }
        }
      }

      return info;
    });

    console.log('Service Worker Info:', JSON.stringify(swInfo, null, 2));

    if (swInfo.registrations.length > 0) {
      console.log('\n⚠️  Service Worker detected. Checking for media caching...');

      let hasMediaInCache = false;
      for (const [cacheName, urls] of Object.entries(swInfo.cacheContents)) {
        const mediaUrls = urls.filter(url => url.match(/\.(mp4|mp3|webm|ogg|wav|m4a)/i));
        if (mediaUrls.length > 0) {
          hasMediaInCache = true;
          console.log(`\n❌ Cache "${cacheName}" contains media files:`);
          mediaUrls.forEach(url => console.log(`  - ${url}`));
        }
      }

      if (hasMediaInCache) {
        console.log('\n⚠️  ISSUE: Media files are being cached by Service Worker.');
        console.log('This can cause playback issues in iOS PWA mode.');
      } else {
        console.log('✅ No media files found in Service Worker caches');
      }
    }
  });
});