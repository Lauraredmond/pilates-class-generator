import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

/**
 * k6 Smoke Test: Class Generation API (Database Mode)
 *
 * This smoke test validates basic functionality and performance
 * of the class generation API using database mode (no AI costs).
 *
 * Test Stages:
 * 1. Ramp up to 5 users over 2 minutes
 * 2. Hold 5 users for 5 minutes
 * 3. Ramp down to 0 over 1 minute
 *
 * Total Duration: 8 minutes
 * Cost: $0 (database mode only)
 *
 * Usage:
 *   k6 run load-tests/smoke-test.js
 */

// Custom metrics
const errorRate = new Rate('errors');
const classGenerationDuration = new Trend('class_generation_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 5 },   // Ramp up to 5 users
    { duration: '5m', target: 5 },   // Hold at 5 users
    { duration: '1m', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% of requests must complete within 5s
    http_req_failed: ['rate<0.1'],     // <10% error rate allowed
    errors: ['rate<0.1'],              // <10% custom error rate
  },
};

// Base URLs (use environment variables or defaults)
const BASE_URL = __ENV.API_BASE_URL || 'https://pilates-dev-i0jb.onrender.com';

// Test data variations
const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
const durations = [20, 30, 45];
const focusAreas = [
  ['core', 'flexibility'],
  ['legs', 'balance'],
  ['arms', 'back'],
  ['core', 'legs', 'arms'],
];

/**
 * Main test function - runs for each virtual user iteration
 */
export default function (data) {
  // Select random test data
  const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
  const duration = durations[Math.floor(Math.random() * durations.length)];
  const focus = focusAreas[Math.floor(Math.random() * focusAreas.length)];

  // Prepare request payload
  const payload = JSON.stringify({
    difficulty: difficulty,
    duration: duration,
    focus_areas: focus,
    use_ai_mode: false,  // ← DATABASE MODE ONLY (no AI costs)
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.access_token}`,  // ← JWT authentication
    },
    timeout: '10s', // 10 second timeout
  };

  // Make request to class generation endpoint
  const startTime = Date.now();
  const response = http.post(
    `${BASE_URL}/api/agents/generate-complete-class`,
    payload,
    params
  );
  const endTime = Date.now();

  // Record custom metric
  classGenerationDuration.add(endTime - startTime);

  // Validate response
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'has data': (r) => r.json('data') !== undefined,
    'has preparation': (r) => r.json('data.preparation') !== undefined,
    'has warmup': (r) => r.json('data.warmup') !== undefined,
    'has movements': (r) => {
      const movements = r.json('data.movements');
      return Array.isArray(movements) && movements.length > 0;
    },
    'has cooldown': (r) => r.json('data.cooldown') !== undefined,
    'has meditation': (r) => r.json('data.meditation') !== undefined,
    'has homecare': (r) => r.json('data.homecare') !== undefined,
    'response time < 5s': (r) => r.timings.duration < 5000,
  });

  // Track errors
  errorRate.add(!success);

  // Log failures for debugging
  if (!success) {
    console.error(`Request failed: ${response.status} - ${response.body.substring(0, 200)}`);
  }

  // Simulate realistic user behavior (wait 10-30s between requests)
  sleep(10 + Math.random() * 20);
}

/**
 * Setup function - runs once before test starts
 */
export function setup() {
  console.log('🚀 Starting smoke test...');
  console.log(`Target: ${BASE_URL}`);
  console.log('Mode: Database only (no AI costs)');
  console.log('Duration: 8 minutes');
  console.log('Virtual Users: 5');
  console.log('');

  // Step 1: Test connectivity
  const healthCheck = http.get(`${BASE_URL}/health`);
  if (healthCheck.status !== 200) {
    console.error('⚠️  Health check failed - backend may be unavailable');
  }

  // Step 2: Login to get JWT token
  const testEmail = __ENV.TEST_USER_EMAIL || 'laura@bassline.ie';
  const testPassword = __ENV.TEST_USER_PASSWORD || 'Change when you see this!';

  console.log(`Logging in as: ${testEmail}`);

  const loginPayload = JSON.stringify({
    email: testEmail,
    password: testPassword,
  });

  const loginResponse = http.post(
    `${BASE_URL}/api/auth/login`,
    loginPayload,
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '10s',
    }
  );

  if (loginResponse.status !== 200) {
    console.error(`❌ Login failed (${loginResponse.status}): ${loginResponse.body}`);
    console.error('Please check TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables');
    throw new Error('Authentication failed - cannot proceed with test');
  }

  const tokens = loginResponse.json();
  console.log('✅ Authentication successful!');
  console.log('');

  return {
    access_token: tokens.access_token,
  };
}

/**
 * Teardown function - runs once after test completes
 */
export function teardown(data) {
  console.log('');
  console.log('✅ Smoke test complete!');
  console.log('Check the summary above for results.');
}
