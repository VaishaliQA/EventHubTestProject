import { test, expect } from '@playwright/test';

// ── Constants ──────────────────────────────────────────────────────────────────

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

// Test account credentials for login and registration tests
const TEST_USER_EMAIL = 'testuser' + Date.now() + '@example.com';
const TEST_USER_PASSWORD = 'StrongPass123!';
const EXISTING_USER_EMAIL = 'rahulshetty1@gmail.com';
const EXISTING_USER_PASSWORD = 'Magiclife1!';

// ── Test Suite: Registration ───────────────────────────────────────────────────

test.describe('Registration Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to registration page before each test
    await page.goto(`${BASE_URL}/register`);
    await expect(page).toHaveURL(`${BASE_URL}/register`);
  });

  test('should successfully register with valid credentials', async ({ page }) => {
    // Step 1: Fill registration form
    const uniqueEmail = 'newuser' + Date.now() + '@example.com';
    const password = 'ValidPass123!';

    await page.getByLabel('Email').fill(uniqueEmail);
    await page.getByLabel('Password').fill(password);
    await page.getByLabel('Confirm Password').fill(password);

    // Step 2: Submit registration form
    await page.getByTestId('register-btn').click();

    // Step 3: Verify redirect to home page
    await expect(page).toHaveURL(`${BASE_URL}/`, { timeout: 5000 });

    // Step 4: Verify JWT token is stored in localStorage
    const token = await page.evaluate(() => {
      return localStorage.getItem('eventhub_token');
    });
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    expect(token?.length).toBeGreaterThan(10);

    // Step 5: Verify authenticated state - "Browse Events" link visible
    await expect(page.getByRole('link', { name: /Browse Events/i })).toBeVisible();
  });

  test('should show error for invalid email format', async ({ page }) => {
    const invalidEmail = 'not-an-email';
    const password = 'ValidPass123!';

    await page.getByLabel('Email').fill(invalidEmail);
    await page.getByLabel('Password').fill(password);
    await page.getByLabel('Confirm Password').fill(password);
    await page.getByTestId('register-btn').click();

    // Verify error message for invalid email
    await expect(page.getByText(/enter a valid email|invalid email/i)).toBeVisible({ timeout: 3000 });

    // Verify user stays on registration page
    await expect(page).toHaveURL(`${BASE_URL}/register`);
  });

  test('should show error for weak password', async ({ page }) => {
    const email = 'testuser' + Date.now() + '@example.com';
    const weakPassword = 'weak'; // less than 8 chars, no uppercase, no number, no special char

    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(weakPassword);
    await page.getByLabel('Confirm Password').fill(weakPassword);
    await page.getByTestId('register-btn').click();

    // Verify error message for weak password
    await expect(page.getByText(/password does not meet|requirements/i)).toBeVisible({ timeout: 3000 });

    // Verify user stays on registration page
    await expect(page).toHaveURL(`${BASE_URL}/register`);
  });

  test('should show error when passwords do not match', async ({ page }) => {
    const email = 'testuser' + Date.now() + '@example.com';
    const password = 'ValidPass123!';
    const confirmPassword = 'ValidPass124!'; // Different password

    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByLabel('Confirm Password').fill(confirmPassword);
    await page.getByTestId('register-btn').click();

    // Verify error message for mismatched passwords
    await expect(page.getByText(/passwords do not match|do not match/i)).toBeVisible({ timeout: 3000 });

    // Verify user stays on registration page
    await expect(page).toHaveURL(`${BASE_URL}/register`);
  });

  test('should show error for duplicate email', async ({ page }) => {
    // Attempt to register with an existing email
    const existingEmail = EXISTING_USER_EMAIL;
    const password = 'ValidPass123!';

    await page.getByLabel('Email').fill(existingEmail);
    await page.getByLabel('Password').fill(password);
    await page.getByLabel('Confirm Password').fill(password);
    await page.getByTestId('register-btn').click();

    // Verify error message for duplicate email (API response)
    await expect(page.getByText(/already exists|already registered|duplicate/i)).toBeVisible({ timeout: 3000 });

    // Verify user stays on registration page
    await expect(page).toHaveURL(`${BASE_URL}/register`);
  });

  test('should have "Sign in" link to navigate to login page', async ({ page }) => {
    // Step 1: Verify sign in link exists on registration page
    const signInLink = page.getByRole('link', { name: /sign in|already have an account/i });
    await expect(signInLink).toBeVisible();

    // Step 2: Click sign in link
    await signInLink.click();

    // Step 3: Verify navigation to login page
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });

});

// ── Test Suite: Login ──────────────────────────────────────────────────────────

test.describe('Login Flow', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // Step 1: Fill login form with known working credentials
    await page.getByPlaceholder('you@email.com').fill(EXISTING_USER_EMAIL);
    await page.getByLabel('Password').fill(EXISTING_USER_PASSWORD);

    // Step 2: Submit login form
    await page.locator('#login-btn').click();

    // Step 3: Verify redirect to home page
    await expect(page).toHaveURL(`${BASE_URL}/`, { timeout: 5000 });

    // Step 4: Verify JWT token is stored in localStorage
    const token = await page.evaluate(() => {
      return localStorage.getItem('eventhub_token');
    });
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    expect(token?.length).toBeGreaterThan(10);

    // Step 5: Verify authenticated state - "Browse Events" link visible
    await expect(page.getByRole('link', { name: /Browse Events/i })).toBeVisible();
  });

  test('should show error for invalid email format', async ({ page }) => {
    const invalidEmail = 'not-an-email';
    const password = EXISTING_USER_PASSWORD;

    await page.getByPlaceholder('you@email.com').fill(invalidEmail);
    await page.getByLabel('Password').fill(password);
    await page.locator('#login-btn').click();

    // Verify error message
    await expect(page.getByText(/enter a valid email|invalid email/i)).toBeVisible({ timeout: 3000 });

    // Verify user stays on login page
    await expect(page).toHaveURL(`${BASE_URL}/login`);

    // Verify token is NOT in localStorage
    const token = await page.evaluate(() => {
      return localStorage.getItem('eventhub_token');
    });
    expect(token).toBeFalsy();
  });

  test('should show error for non-existent user', async ({ page }) => {
    // Step 1: Use an email that doesn't exist
    const nonExistentEmail = 'nonexistent' + Date.now() + '@example.com';
    const password = 'SomePassword123!';

    await page.getByPlaceholder('you@email.com').fill(nonExistentEmail);
    await page.getByLabel('Password').fill(password);

    // Step 2: Submit login form
    await page.locator('#login-btn').click();

    // Step 3: Verify error message (user not found or invalid credentials)
    await expect(page.getByText(/user not found|invalid credentials|does not exist/i)).toBeVisible({ timeout: 3000 });

    // Step 4: Verify user stays on login page
    await expect(page).toHaveURL(`${BASE_URL}/login`);

    // Step 5: Verify token is NOT in localStorage
    const token = await page.evaluate(() => {
      return localStorage.getItem('eventhub_token');
    });
    expect(token).toBeFalsy();
  });

  test('should show error for incorrect password', async ({ page }) => {
    // Step 1: Use correct email but wrong password
    const email = EXISTING_USER_EMAIL;
    const wrongPassword = 'WrongPassword123!';

    await page.getByPlaceholder('you@email.com').fill(email);
    await page.getByLabel('Password').fill(wrongPassword);

    // Step 2: Submit login form
    await page.locator('#login-btn').click();

    // Step 3: Verify error message (incorrect password)
    await expect(page.getByText(/incorrect|invalid|password/i)).toBeVisible({ timeout: 3000 });

    // Step 4: Verify user stays on login page
    await expect(page).toHaveURL(`${BASE_URL}/login`);

    // Step 5: Verify token is NOT in localStorage
    const token = await page.evaluate(() => {
      return localStorage.getItem('eventhub_token');
    });
    expect(token).toBeFalsy();
  });

  test('should require email field', async ({ page }) => {
    // Step 1: Leave email empty, fill password
    await page.getByLabel('Password').fill(EXISTING_USER_PASSWORD);

    // Step 2: Try to submit
    await page.locator('#login-btn').click();

    // Step 3: Verify error message for empty email
    await expect(page.getByText(/email.*required|enter.*email/i)).toBeVisible({ timeout: 3000 });

    // Step 4: Verify user stays on login page
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });

  test('should require password field', async ({ page }) => {
    // Step 1: Fill email, leave password empty
    await page.getByPlaceholder('you@email.com').fill(EXISTING_USER_EMAIL);

    // Step 2: Try to submit
    await page.locator('#login-btn').click();

    // Step 3: Verify error message for empty password
    await expect(page.getByText(/password.*required|enter.*password|least 6/i)).toBeVisible({ timeout: 3000 });

    // Step 4: Verify user stays on login page
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });

  test('should have "Register" link to navigate to registration page', async ({ page }) => {
    // Step 1: Verify register link exists on login page
    const registerLink = page.getByRole('link', { name: /register|don't have an account|create account/i });
    await expect(registerLink).toBeVisible();

    // Step 2: Click register link
    await registerLink.click();

    // Step 3: Verify navigation to registration page
    await expect(page).toHaveURL(`${BASE_URL}/register`);
  });

});

// ── Test Suite: Authenticated State ────────────────────────────────────────────

test.describe('Authenticated State Management', () => {

  test('should maintain authentication after page reload', async ({ page }) => {
    // Step 1: Login
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('you@email.com').fill(EXISTING_USER_EMAIL);
    await page.getByLabel('Password').fill(EXISTING_USER_PASSWORD);
    await page.locator('#login-btn').click();

    // Step 2: Verify login successful
    await expect(page).toHaveURL(`${BASE_URL}/`);
    await expect(page.getByRole('link', { name: /Browse Events/i })).toBeVisible();

    // Step 3: Get token from localStorage
    const tokenBefore = await page.evaluate(() => {
      return localStorage.getItem('eventhub_token');
    });

    // Step 4: Reload page
    await page.reload();

    // Step 5: Verify still on home page (not redirected to login)
    await expect(page).toHaveURL(`${BASE_URL}/`);

    // Step 6: Verify token is still in localStorage
    const tokenAfter = await page.evaluate(() => {
      return localStorage.getItem('eventhub_token');
    });
    expect(tokenAfter).toBe(tokenBefore);

    // Step 7: Verify authenticated state - "Browse Events" link visible
    await expect(page.getByRole('link', { name: /Browse Events/i })).toBeVisible();
  });

  test('should clear authentication on logout (if nav element exists)', async ({ page }) => {
    // Step 1: Login
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('you@email.com').fill(EXISTING_USER_EMAIL);
    await page.getByLabel('Password').fill(EXISTING_USER_PASSWORD);
    await page.locator('#login-btn').click();

    // Step 2: Verify login successful
    await expect(page).toHaveURL(`${BASE_URL}/`);
    await expect(page.getByRole('link', { name: /Browse Events/i })).toBeVisible();

    // Step 3: Verify token exists in localStorage
    let token = await page.evaluate(() => {
      return localStorage.getItem('eventhub_token');
    });
    expect(token).toBeTruthy();

    // Step 4: Look for logout link/button in navbar
    const logoutLink = page.getByRole('button', { name: /logout|sign out/i });
    
    // Only proceed if logout button exists
    if (await logoutLink.isVisible().catch(() => false)) {
      // Step 5: Click logout
      await logoutLink.click();

      // Step 6: Verify token is cleared from localStorage
      token = await page.evaluate(() => {
        return localStorage.getItem('eventhub_token');
      });
      expect(token).toBeFalsy();

      // Step 7: Verify redirect to login page
      await expect(page).toHaveURL(`${BASE_URL}/login`, { timeout: 3000 });
    }
  });

});
