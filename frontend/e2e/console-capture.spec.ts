import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Automated Console Log Capture (Environment-Aware)
 * Captures all console logs, errors, and network requests during class playback
 *
 * Works for both dev and production environments based on project configuration
 *
 * Usage:
 *   npm run test:e2e:console:dev   # Test dev environment only
 *   npm run test:e2e:console:prod  # Test production environment only
 *   npm run test:e2e:console       # Test both environments
 *
 * Output:
 *   - console-{env}.txt (frontend folder for quick access)
 *   - test-results/console-{env}-{timestamp}.txt (detailed timestamped logs)
 *   - {env}-console-capture.png (screenshot at end of test)
 */
test('Capture console logs during class playback', async ({ page, baseURL }) => {
  // Determine environment from baseURL
  const environment = baseURL?.includes('bassline-dev') ? 'dev' : 'production';
  const envLabel = environment.toUpperCase();

  const logs: string[] = [];
  const errors: string[] = [];
  const networkRequests: string[] = [];

  // Capture all console messages
  page.on('console', msg => {
    const logEntry = `[${msg.type().toUpperCase()}] ${msg.text()}`;
    logs.push(logEntry);
    console.log(logEntry);
  });

  // Capture page errors
  page.on('pageerror', err => {
    const errorEntry = `[PAGE ERROR] ${err.message}\n${err.stack}`;
    errors.push(errorEntry);
    console.error(errorEntry);
  });

  // Capture network requests (especially API calls and media)
  page.on('request', request => {
    const url = request.url();
    // Track API calls, music, videos, voiceovers
    if (
      url.includes('/api/') ||
      url.includes('pilates') ||
      url.includes('.mp3') ||
      url.includes('.mp4') ||
      url.includes('s3.amazonaws.com') ||
      url.includes('archive.org') ||
      url.includes('supabase.co')
    ) {
      networkRequests.push(`[REQUEST] ${request.method()} ${url}`);
    }
  });

  page.on('response', response => {
    const url = response.url();
    if (
      url.includes('/api/') ||
      url.includes('pilates') ||
      url.includes('.mp3') ||
      url.includes('.mp4') ||
      url.includes('s3.amazonaws.com') ||
      url.includes('archive.org') ||
      url.includes('supabase.co')
    ) {
      const status = response.status();
      const statusText = status >= 400 ? '❌ FAILED' : '✅ SUCCESS';
      networkRequests.push(`[RESPONSE] ${statusText} ${status} ${url}`);
    }
  });

  // Capture failed requests
  page.on('requestfailed', request => {
    const url = request.url();
    const failure = request.failure();
    errors.push(`[REQUEST FAILED] ${failure?.errorText || 'Unknown error'} - ${url}`);
  });

  console.log(`\n=== Starting ${envLabel} Environment Log Capture ===\n`);

  // Navigate to site (using baseURL from config)
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Look for API Config log
  console.log('\n=== Checking API Configuration ===');
  const apiConfigLog = logs.find(log => log.includes('[API Config]'));
  if (apiConfigLog) {
    console.log('✅ Found:', apiConfigLog);
  } else {
    console.log('❌ API Config log not found!');
  }

  // Handle medical disclaimer
  const noButton = page.locator('button:has-text("No")').first();
  if (await noButton.isVisible()) {
    console.log('\n=== Handling Medical Disclaimer ===');
    await noButton.click();
    await page.waitForTimeout(1000);

    const checkboxes = await page.locator('input[type="checkbox"]').all();
    for (const checkbox of checkboxes) {
      if (await checkbox.isVisible() && !(await checkbox.isChecked())) {
        await checkbox.check();
      }
    }

    const acceptButton = page.locator('button:has-text("Accept")').first();
    if (await acceptButton.isVisible()) {
      await acceptButton.click();
      await page.waitForLoadState('networkidle');
    }
  }

  // Login
  const emailField = page.locator('input[type="email"]').first();
  if (await emailField.isVisible()) {
    console.log('\n=== Logging In ===');
    await emailField.fill('laura.bassline@proton.me');
    await page.locator('input[type="password"]').first().fill('Laura101!!');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  }

  // Navigate to class builder
  const generateButton = page.getByRole('button', { name: /Generate.*Pilates/i });
  if (await generateButton.isVisible()) {
    console.log('\n=== Navigating to Class Builder ===');
    await generateButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  }

  // Generate a class
  const createButton = page.getByRole('button', { name: /Generate|Create/i }).first();
  if (await createButton.isVisible()) {
    console.log('\n=== Generating Class ===');
    await createButton.click();

    // Wait for class generation (can take 30-60s)
    console.log('Waiting for class generation...');
    await page.waitForResponse(
      response => response.url().includes('/api/') && response.status() === 200,
      { timeout: 60000 }
    ).catch(() => console.log('Class generation timeout or failed'));

    await page.waitForTimeout(3000);
  }

  // Try to play the class
  const playButton = page.getByRole('button', { name: /Play|Accept/i }).first();
  if (await playButton.isVisible()) {
    console.log('\n=== Starting Playback ===');
    await playButton.click();

    // CRITICAL: Wait longer to capture media loading errors
    console.log('Waiting 15 seconds to capture media loading attempts...');
    await page.waitForTimeout(15000);

    // Check for specific media errors
    console.log('\n=== Checking for Media Errors ===');
    const musicErrors = errors.filter(e => e.includes('music') || e.includes('.mp3'));
    const videoErrors = errors.filter(e => e.includes('video') || e.includes('.mp4'));

    if (musicErrors.length > 0) {
      console.log('❌ Music errors found:', musicErrors.length);
    } else {
      console.log('✅ No music errors detected');
    }

    if (videoErrors.length > 0) {
      console.log('❌ Video errors found:', videoErrors.length);
    } else {
      console.log('✅ No video errors detected');
    }
  }

  // Capture final screenshot
  const screenshotPath = `${environment}-console-capture.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });

  // Write logs to file
  const outputDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFile = path.join(outputDir, `console-${environment}-${timestamp}.txt`);

  const output = [
    '='.repeat(80),
    `${envLabel} ENVIRONMENT CONSOLE LOG CAPTURE`,
    `Timestamp: ${new Date().toISOString()}`,
    `URL: ${baseURL}`,
    '='.repeat(80),
    '',
    '=== API CONFIGURATION ===',
    apiConfigLog || '❌ API Config log not found',
    '',
    '=== CONSOLE LOGS ===',
    ...logs,
    '',
    '=== NETWORK REQUESTS ===',
    ...networkRequests,
    '',
    '=== ERRORS ===',
    ...(errors.length > 0 ? errors : ['✅ No errors captured']),
    '',
    '='.repeat(80),
  ].join('\n');

  fs.writeFileSync(logFile, output);
  console.log(`\n✅ Logs written to: ${logFile}`);
  console.log(`✅ Screenshot saved: ${screenshotPath}`);

  // Also write to console-{env}.txt in frontend folder for easy access
  const easyAccessLog = path.join(process.cwd(), `console-${environment}.txt`);
  fs.writeFileSync(easyAccessLog, output);
  console.log(`✅ Also saved to: ${easyAccessLog}`);

  // Summary
  console.log(`\n=== ${envLabel} TEST SUMMARY ===`);
  console.log(`Total logs: ${logs.length}`);
  console.log(`Total network requests: ${networkRequests.length}`);
  console.log(`Total errors: ${errors.length}`);
});
