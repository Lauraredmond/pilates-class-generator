// ============================================
// VIDEO DIAGNOSTIC SCRIPT
// Run this in browser console (F12)
// ============================================

async function diagnoseVideoIssue() {
  console.log('=' + '='.repeat(78));
  console.log('🔍 VIDEO DIAGNOSTIC TOOL - Prep & Warmup');
  console.log('=' + '='.repeat(78));

  // Step 1: Get JWT token
  const token = localStorage.getItem('pilates_auth_token');
  if (!token) {
    console.error('❌ No JWT token found - please login first');
    return;
  }
  console.log('✅ JWT token found\n');

  // Step 2: Test Preparation Endpoint
  console.log('--- Testing Preparation Endpoint ---');
  try {
    const prepRes = await fetch('https://pilates-class-generator-api3.onrender.com/api/class-sections/preparation', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('Response status:', prepRes.status);

    const prepData = await prepRes.json();
    console.log('Response data:', prepData);

    if (prepData && prepData.length > 0) {
      const firstRecord = prepData[0];
      console.log('\nFirst record fields:', Object.keys(firstRecord));
      console.log('script_name:', firstRecord.script_name);
      console.log('video_url:', firstRecord.video_url);

      if (firstRecord.video_url) {
        console.log('✅ Preparation video_url IS present:', firstRecord.video_url);
      } else {
        console.error('❌ Preparation video_url is NULL/undefined');
        console.error('   → Backend NOT returning video_url field');
      }
    }
  } catch (err) {
    console.error('❌ Preparation endpoint failed:', err);
  }

  // Step 3: Test Warmup Endpoint
  console.log('\n--- Testing Warmup Endpoint ---');
  try {
    const warmupRes = await fetch('https://pilates-class-generator-api3.onrender.com/api/class-sections/warmup', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('Response status:', warmupRes.status);

    const warmupData = await warmupRes.json();
    console.log('Response data:', warmupData);

    if (warmupData && warmupData.length > 0) {
      const firstRecord = warmupData[0];
      console.log('\nFirst record fields:', Object.keys(firstRecord));
      console.log('routine_name:', firstRecord.routine_name);
      console.log('video_url:', firstRecord.video_url);

      if (firstRecord.video_url) {
        console.log('✅ Warmup video_url IS present:', firstRecord.video_url);
      } else {
        console.error('❌ Warmup video_url is NULL/undefined');
        console.error('   → Backend NOT returning video_url field');
      }
    }
  } catch (err) {
    console.error('❌ Warmup endpoint failed:', err);
  }

  console.log('\n' + '='.repeat(80));
  console.log('DIAGNOSTIC COMPLETE');
  console.log('='.repeat(80));
  console.log('\nNext steps:');
  console.log('1. If video_url present → Check frontend data mapping');
  console.log('2. If video_url missing → Backend deployment issue');
  console.log('3. Share this console output for further diagnosis');
}

// Run the diagnostic
diagnoseVideoIssue();
