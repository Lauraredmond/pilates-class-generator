import { chromium } from 'playwright';

async function testFadeInFullscreen() {
  console.log('🎭 Testing fade-out in fullscreen and voiceover sync...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 50
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Collect ALL console messages
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({ time: Date.now(), text });

    // Log important messages
    if (text.includes('TIMER') || text.includes('FADE') || text.includes('VIDEO') ||
        text.includes('ended') || text.includes('opacity') || text.includes('fullscreen')) {
      console.log(`📝 [${new Date().toISOString().split('T')[1].split('.')[0]}] ${text}`);
    }
  });

  try {
    console.log('1️⃣ Navigating to dev site...');
    await page.goto('https://bassline-dev.netlify.app', { waitUntil: 'networkidle' });

    // Handle health modal if present
    const disclaimerModal = page.locator('text=Medical Safety Disclaimer');
    if (await disclaimerModal.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.locator('button:has-text("No")').click();
      await page.waitForTimeout(500);
      await page.locator('input[type="checkbox"]').first().check();
      await page.locator('input[type="checkbox"]').nth(1).check();
      await page.locator('button:has-text("Accept - Continue to App")').click();
      await page.waitForTimeout(500);
    }

    console.log('2️⃣ Navigating to Class Builder...');
    await page.click('text=Generate');
    await page.waitForURL(/\/class-builder/, { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Select 12-minute class for faster testing
    await page.selectOption('select >> nth=0', { label: '12 minutes - Quick practice' });
    await page.selectOption('select >> nth=1', { label: 'Beginner' });

    console.log('3️⃣ Generating class...');
    await page.click('button:has-text("Generate Class Plan")');
    await page.waitForSelector('text=Your Auto-Generated Class', { timeout: 60000 });

    console.log('4️⃣ Starting playback...');
    await page.click('button:has-text("Accept & Add to Class")');
    await page.waitForSelector('button:has-text("Play Class")', { timeout: 5000 });
    await page.click('button:has-text("Play Class")');
    await page.waitForSelector('button[aria-label="Pause"]', { timeout: 10000 });

    console.log('5️⃣ Monitoring video behavior and fade-out...\n');

    // Function to check video and fade state
    async function checkVideoState() {
      const videos = await page.$$('video');
      const results = [];

      for (let i = 0; i < videos.length; i++) {
        const videoData = await videos[i].evaluate(video => {
          const styles = window.getComputedStyle(video);
          const container = video.closest('div');
          const containerStyles = container ? window.getComputedStyle(container) : null;

          return {
            src: video.src ? video.src.split('/').pop().substring(0, 40) : 'none',
            currentTime: video.currentTime,
            duration: video.duration,
            paused: video.paused,
            ended: video.ended,
            opacity: styles.opacity,
            transition: styles.transition,
            display: styles.display,
            containerOpacity: containerStyles?.opacity || 'N/A',
            isFullscreen: !!(document.fullscreenElement ||
                           document.webkitFullscreenElement ||
                           document.mozFullScreenElement ||
                           document.msFullscreenElement),
            fullscreenElement: document.fullscreenElement?.tagName || 'none'
          };
        });
        results.push(videoData);
      }

      return results;
    }

    // Monitor for side-bend specifically
    let sideBendFound = false;
    let monitoringStartTime = Date.now();
    const maxMonitorTime = 180000; // 3 minutes

    console.log('⏰ Monitoring class playback for fade and timing issues...\n');

    while (Date.now() - monitoringStartTime < maxMonitorTime) {
      // Get current section name
      const sectionName = await page.$eval('h1', el => el.textContent).catch(() => 'Unknown');

      // Check video states
      const videoStates = await checkVideoState();

      for (const video of videoStates) {
        if (video.src !== 'none') {
          console.log(`📹 Section: ${sectionName}`);
          console.log(`   Video: ${video.src}`);
          console.log(`   Time: ${video.currentTime.toFixed(1)}/${video.duration.toFixed(1)}s`);
          console.log(`   Opacity: ${video.opacity} (Container: ${video.containerOpacity})`);
          console.log(`   Fullscreen: ${video.isFullscreen} (Element: ${video.fullscreenElement})`);
          console.log(`   Transition: ${video.transition}\n`);

          // Check for side-bend
          if (sectionName.toLowerCase().includes('side') || sectionName.toLowerCase().includes('bend')) {
            sideBendFound = true;
            console.log('🎯 SIDE-BEND DETECTED - Checking timing...');

            // Check voiceover element
            const voiceoverPlaying = await page.evaluate(() => {
              const audios = document.querySelectorAll('audio');
              for (const audio of audios) {
                if (!audio.paused && audio.src.includes('voiceover')) {
                  return {
                    playing: true,
                    currentTime: audio.currentTime,
                    duration: audio.duration
                  };
                }
              }
              return { playing: false };
            });

            console.log(`   Voiceover: ${voiceoverPlaying.playing ?
              `Playing at ${voiceoverPlaying.currentTime?.toFixed(1)}/${voiceoverPlaying.duration?.toFixed(1)}s` :
              'Not playing'}`);
          }

          // Check if fade is happening
          if (video.opacity !== '1' && video.opacity !== '0') {
            console.log('✨ FADE IN PROGRESS! Opacity:', video.opacity);
          }

          // Try to trigger fullscreen if not already
          if (!video.isFullscreen && video.currentTime > 2 && video.currentTime < 10) {
            console.log('🎬 Attempting to enter fullscreen...');
            await videos[0].evaluate(v => {
              if (v.requestFullscreen) {
                v.requestFullscreen().catch(e => console.log('Fullscreen failed:', e));
              }
            });
          }
        }
      }

      // Check recent console logs for fade/timer messages
      const recentLogs = consoleLogs.filter(log => Date.now() - log.time < 5000);
      const fadeOrTimerLogs = recentLogs.filter(log =>
        log.text.includes('FADE') || log.text.includes('TIMER') || log.text.includes('SECTION')
      );

      if (fadeOrTimerLogs.length > 0) {
        console.log('📋 Recent timer/fade logs:');
        fadeOrTimerLogs.forEach(log => console.log(`   ${log.text}`));
        console.log('');
      }

      await page.waitForTimeout(3000); // Check every 3 seconds

      // Try to advance to next section if stuck
      const nextButton = page.locator('button[aria-label="Next"]');
      if (await nextButton.isEnabled({ timeout: 1000 }).catch(() => false)) {
        const shouldAdvance = Math.random() > 0.7; // 30% chance to advance
        if (shouldAdvance) {
          console.log('⏭️ Advancing to next section...\n');
          await nextButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST ANALYSIS');
    console.log('='.repeat(60));

    // Analyze fade-related logs
    const fadeRelatedLogs = consoleLogs.filter(log =>
      log.text.includes('FADE') || log.text.includes('opacity') || log.text.includes('ended')
    );

    console.log(`\nFade-related logs found: ${fadeRelatedLogs.length}`);
    if (fadeRelatedLogs.length > 0) {
      console.log('Last 5 fade logs:');
      fadeRelatedLogs.slice(-5).forEach(log => console.log(`  ${log.text}`));
    }

    // Check timer logs
    const timerLogs = consoleLogs.filter(log => log.text.includes('TIMER'));
    console.log(`\nTimer logs found: ${timerLogs.length}`);
    if (timerLogs.length > 0) {
      console.log('Sample timer logs:');
      timerLogs.slice(0, 3).forEach(log => console.log(`  ${log.text}`));
    }

    console.log(`\nSide-bend movement found: ${sideBendFound ? '✅ YES' : '❌ NO'}`);

    // Final video state check
    const finalVideoStates = await checkVideoState();
    console.log('\nFinal video states:');
    finalVideoStates.forEach(v => {
      if (v.src !== 'none') {
        console.log(`  Video opacity: ${v.opacity}, Fullscreen: ${v.isFullscreen}`);
      }
    });

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    console.log('\n🎭 Test complete. Browser will close in 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testFadeInFullscreen().catch(console.error);