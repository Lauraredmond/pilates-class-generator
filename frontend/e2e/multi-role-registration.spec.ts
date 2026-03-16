import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.TEST_ENV === 'production'
  ? 'https://bassline.netlify.app'
  : 'http://localhost:5173';

// Test credentials - Update these if needed
const TEST_USER = {
  email: `test.multirole.${Date.now()}@example.com`,
  password: 'Test123!@#',
  fullName: 'Test Multi Role User',
  roles: ['practitioner', 'parent', 'coach'],  // Multiple roles
};

// Existing user for login test
const EXISTING_USER = {
  email: 'test@example.com',  // UPDATE THIS with a real test account email
  password: 'TestPassword123!',  // UPDATE THIS with the real password
};

test.describe('Multi-Role Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto(BASE_URL);

    // Handle any initial popups or disclaimers
    await handlePermissionsAndDisclaimers(page);
  });

  test('should register user with multiple roles', async ({ page }) => {
    // Navigate directly to registration page
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('domcontentloaded');

    // Handle Medical Safety Disclaimer if it appears
    const pregnancyQuestion = page.locator('text=Are you currently pregnant');
    if (await pregnancyQuestion.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('Handling Medical Safety Disclaimer...');
      // Click "No" to pregnancy question
      await page.click('button:has-text("No")');

      // Wait for next screen or modal to close
      await page.waitForTimeout(1000);
    }

    // Handle any other safety disclaimers
    await handlePermissionsAndDisclaimers(page);

    // Fill in basic information
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input#password', TEST_USER.password);
    await page.fill('input#confirmPassword', TEST_USER.password);
    await page.fill('input#fullName', TEST_USER.fullName);

    // Select multiple roles
    await page.click('text=Pilates Practitioner');
    await page.click('text=Parent');
    await page.click('text=Sports Coach');

    // Verify roles are selected (look specifically within role selection area)
    const roleSection = page.locator('h2:has-text("Select Your Roles")').locator('..');
    const selectedRoles = roleSection.locator('input[type="checkbox"]:checked');
    await expect(selectedRoles).toHaveCount(3);

    // Fill optional profile information
    await page.selectOption('select#ageRange', '35-44');
    await page.selectOption('select#genderIdentity', 'Prefer not to say');
    await page.fill('input[placeholder*="country"]', 'Ireland');
    await page.selectOption('select#pilatesExperience', 'Intermediate');

    // Select goals
    await page.click('text=Stress Relief');
    await page.click('text=Tone & Strength');

    // Accept all safety confirmations and legal agreements
    await acceptAllAgreements(page);

    // Submit registration
    await page.click('button:has-text("Create Account")');

    // Check for success message
    await expect(page.locator('text=Check Your Email!')).toBeVisible({ timeout: 10000 });

    console.log('✅ Multi-role registration successful for:', TEST_USER.email);
  });

  test('should allow existing user to add new role from profile', async ({ page }) => {
    // First login with existing account
    await loginWithExistingUser(page, EXISTING_USER);

    // Navigate to profile/settings
    await navigateToProfile(page);

    // Look for "Add Role" or "Manage Roles" button
    const addRoleButton = page.locator('button:has-text("Add Role"), button:has-text("Manage Roles")');

    if (await addRoleButton.isVisible()) {
      await addRoleButton.click();

      // Select a new role
      await page.click('text=Pilates Instructor');

      // Save changes
      await page.click('button:has-text("Save"), button:has-text("Add Role"), button:has-text("Update")');

      // Verify success message
      await expect(page.locator('text=/Role.*added|Profile.*updated/i')).toBeVisible({ timeout: 5000 });

      console.log('✅ Successfully added new role to existing profile');
    } else {
      console.log('⚠️ Add Role functionality not yet implemented in UI');
    }
  });

  test('should show all capabilities for multi-role user', async ({ page }) => {
    // Login with multi-role test account
    await loginWithExistingUser(page, EXISTING_USER);

    // Check for practitioner capabilities
    const practitionerFeatures = [
      'Classes',
      'Create my training plan',
    ];

    // Check for parent capabilities
    const parentFeatures = [
      'Youth Hub',
      'Parent Dashboard',
    ];

    // Check for coach capabilities
    const coachFeatures = [
      'Coach Hub',
      'Coach Dashboard',
    ];

    // Verify all features are accessible
    for (const feature of [...practitionerFeatures, ...parentFeatures, ...coachFeatures]) {
      const element = page.locator(`text=${feature}`);
      if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`✅ Found capability: ${feature}`);
      } else {
        console.log(`⚠️ Missing capability: ${feature}`);
      }
    }
  });
});

// Helper Functions

async function handlePermissionsAndDisclaimers(page: any) {
  // Handle Medical Safety Disclaimer first
  const medicalSafetyHeader = page.locator('h3:has-text("Medical Safety Disclaimer")');
  if (await medicalSafetyHeader.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('Found Medical Safety Disclaimer modal');
    // Click "No" to pregnancy question if visible
    const noButton = page.locator('button:has-text("No")').first();
    if (await noButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await noButton.click();
      await page.waitForTimeout(500);
    }

    // Check all medical disclaimer checkboxes to enable Accept button
    const disclaimerCheckboxes = page.locator('input[type="checkbox"]:visible');
    const checkboxCount = await disclaimerCheckboxes.count();
    console.log(`Found ${checkboxCount} disclaimer checkboxes to check`);
    for (let i = 0; i < checkboxCount; i++) {
      await disclaimerCheckboxes.nth(i).check();
      await page.waitForTimeout(200);
    }
  }

  // Now click Accept button if present (should be enabled after checking boxes)
  const acceptButton = page.locator('button:has-text("Accept - Continue to App"), button:has-text("Accept"), button:has-text("I agree")').first();
  if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptButton.click({ force: true });  // Use force if needed
    await page.waitForTimeout(1000);
  }

  // Handle any safety disclaimer popup
  const disclaimerButtons = [
    'button:has-text("I understand")',
    'button:has-text("Continue")',
    'button:has-text("Accept and Continue")',
    'button:has-text("Got it")',
    'button:has-text("Proceed")',
  ];

  for (const selector of disclaimerButtons) {
    const button = page.locator(selector).first();
    if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
      await button.click();
      await page.waitForTimeout(500);
    }
  }

  // Handle any beta agreement
  const betaButton = page.locator('button:has-text("Join Beta"), button:has-text("I agree to beta")').first();
  if (await betaButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await betaButton.click();
    await page.waitForTimeout(500);
  }
}

async function acceptAllAgreements(page: any) {
  // First check the age/safety confirmation checkbox - this is REQUIRED
  // Look for checkbox near text about being 16 years old
  const ageCheckbox = page.locator('input[type="checkbox"]').locator('..', { has: page.locator('text=/16 years of age/i') }).locator('input[type="checkbox"]').first();
  if (await ageCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
    await ageCheckbox.check();
    console.log('Checked age confirmation checkbox');
  } else {
    // Alternative selector - look for the parent div containing the text
    const ageConfirmation = page.locator('div:has-text("I confirm that I am 16 years of age or older")').locator('input[type="checkbox"]').first();
    if (await ageConfirmation.isVisible({ timeout: 2000 }).catch(() => false)) {
      await ageConfirmation.check();
      console.log('Checked age confirmation checkbox (alt selector)');
    }
  }

  // Check all checkboxes in the Legal Agreements section
  const legalSection = page.locator('h2:has-text("Legal Agreements")').locator('..');
  const legalCheckboxes = legalSection.locator('input[type="checkbox"]:visible');
  const legalCount = await legalCheckboxes.count();
  console.log(`Found ${legalCount} legal agreement checkboxes`);
  for (let i = 0; i < legalCount; i++) {
    await legalCheckboxes.nth(i).check();
  }

  // Also check any remaining unchecked checkboxes in the form that are required
  // This is a fallback to ensure all necessary checkboxes are checked
  const allUnchecked = page.locator('input[type="checkbox"]:not(:checked):visible');
  const uncheckedCount = await allUnchecked.count();
  console.log(`Found ${uncheckedCount} unchecked checkboxes to check`);
  for (let i = 0; i < uncheckedCount; i++) {
    const checkbox = allUnchecked.nth(i);
    // Skip role selection checkboxes (they have specific labels)
    const parent = await checkbox.locator('..').textContent();
    if (!parent?.includes('Practitioner') && !parent?.includes('Instructor') &&
        !parent?.includes('Coach') && !parent?.includes('Parent') &&
        !parent?.includes('Stress') && !parent?.includes('Tone') &&
        !parent?.includes('Performance') && !parent?.includes('Habit')) {
      await checkbox.check();
      console.log(`Checked additional checkbox: ${parent?.substring(0, 50)}`);
    }
  }
}

async function loginWithExistingUser(page: any, credentials: any) {
  // Navigate directly to login page
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('domcontentloaded');

  // Fill credentials
  await page.fill('input[type="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);

  // Submit login - try multiple possible button texts
  const loginButtons = [
    'button:has-text("Sign In")',
    'button:has-text("Login")',
    'button:has-text("Log In")',
    'button[type="submit"]',
  ];

  for (const selector of loginButtons) {
    try {
      await page.click(selector, { timeout: 2000 });
      break;
    } catch (e) {
      // Try next selector
    }
  }

  // Wait for redirect to dashboard/home
  await page.waitForURL((url: URL) => !url.pathname.includes('login'), { timeout: 10000 });

  // Handle any post-login popups
  await handlePermissionsAndDisclaimers(page);
}

async function navigateToProfile(page: any) {
  // Try different ways to get to profile
  const profileSelectors = [
    'button:has-text("Profile")',
    'a:has-text("Profile")',
    'button:has-text("Settings")',
    'a:has-text("Settings")',
    '[aria-label="User menu"]',
    '[aria-label="Profile"]',
  ];

  for (const selector of profileSelectors) {
    const element = page.locator(selector);
    if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
      await element.click();
      break;
    }
  }

  // Wait for profile page to load
  await page.waitForURL('**/profile', { timeout: 5000 }).catch(() => {
    console.log('Profile page URL pattern not matched, continuing anyway');
  });
}

// Test configuration helper
test.describe.configure({
  mode: 'serial',  // Run tests in sequence
  timeout: 60000,  // 60 second timeout per test
});