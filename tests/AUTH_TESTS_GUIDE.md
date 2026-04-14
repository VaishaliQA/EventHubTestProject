# Authentication & Registration E2E Tests

## Overview
Comprehensive end-to-end test suite for user registration and login flows, built with Playwright. This test suite verifies:

- **Registration Flow**: Valid/invalid inputs, duplicate emails, password validation, token storage, redirect behavior
- **Login Flow**: Valid/invalid credentials, error handling, token management, authenticated state persistence
- **Auth State Management**: Token persistence after reload, logout functionality

## Test File Location
```
tests/auth-registration-login.spec.js
```

## Test Coverage

### Registration Test Suite (6 tests)
1. ✅ **Successful registration with valid credentials**
   - Validates: Account creation, JWT token storage, redirect to home
   - Business Rule: New user must receive JWT token and be authenticated

2. ✅ **Show error for invalid email format**
   - Validates: Email validation before submission
   - Business Rule: Email must be in valid format (user@domain.com)

3. ✅ **Show error for weak password**
   - Validates: Client-side password strength requirements
   - Business Rule: Password requires: 8+ chars, 1 uppercase, 1 number, 1 special char

4. ✅ **Show error when passwords do not match**
   - Validates: Password confirmation validation
   - Business Rule: Confirm password must match password field

5. ✅ **Show error for duplicate email**
   - Validates: Server-side duplicate email check
   - Business Rule: Email must be unique across all users

6. ✅ **Have "Sign in" link to navigate to login page**
   - Validates: Navigation between auth pages
   - Business Rule: Users can switch from register to login

### Login Test Suite (7 tests)
1. ✅ **Successful login with valid credentials**
   - Validates: Account authentication, JWT token storage, home page redirect
   - Business Rule: Valid email/password grants JWT token and authenticated access

2. ✅ **Show error for invalid email format**
   - Validates: Email format validation
   - Business Rule: Invalid email rejected before API call

3. ✅ **Show error for non-existent user**
   - Validates: User lookup failure
   - Business Rule: Non-existent email returns error (no signup hint for security)

4. ✅ **Show error for incorrect password**
   - Validates: Password mismatch detection
   - Business Rule: Wrong password denies access

5. ✅ **Require email field**
   - Validates: Empty email field validation
   - Business Rule: Email is mandatory

6. ✅ **Require password field**
   - Validates: Empty password field validation
   - Business Rule: Password is mandatory

7. ✅ **Have "Register" link to navigate to registration page**
   - Validates: Navigation between auth pages
   - Business Rule: Users can switch from login to register

### Authenticated State Management Suite (2 tests)
1. ✅ **Maintain authentication after page reload**
   - Validates: Token persistence in localStorage across page reloads
   - Business Rule: User stays authenticated after page reload if token exists

2. ✅ **Clear authentication on logout**
   - Validates: Token removal from localStorage
   - Business Rule: Logout must clear JWT token and redirect to login

---

## Prerequisites

1. **Node.js 18+** installed
2. **MySQL 8+** database running
3. **Application running** on `http://localhost:3000` (frontend) and `http://localhost:3001` (backend)
4. **Database seeded** with test data

## Setup Instructions

### 1. Install Node.js
- Download from: https://nodejs.org/ (LTS version)
- Windows: Run the installer and restart your terminal

### 2. Install Dependencies
```bash
cd c:\Users\User\Downloads\eventhub\eventhub
npm run setup
```

### 3. Configure Environment
Create `.env` files in both frontend and backend directories with database and API configurations (see `.env.example` files).

### 4. Seed Database
```bash
npm run seed
```

This creates 10 static events and initializes the database schema.

---

## Running the Tests

### Start Application (Required First)
Open two terminals:

**Terminal 1 - Start frontend & backend:**
```bash
cd c:\Users\User\Downloads\eventhub\eventhub
npm run dev
```
This starts both frontend (port 3000) and backend (port 3001).

**Terminal 2 - Run tests:**

### Option 1: Run All Auth Tests
```bash
npx playwright test tests/auth-registration-login.spec.js
```

### Option 2: Run Tests with UI Mode (Recommended for Debugging)
```bash
npm run test:ui
```
This opens an interactive Playwright UI where you can:
- Click to run individual tests
- Watch tests execute in a real browser
- Step through test execution
- Inspect elements and debug failures

### Option 3: Run Specific Test
```bash
npx playwright test tests/auth-registration-login.spec.js -g "should successfully register with valid credentials"
```

### Option 4: Run with HTML Reporter
```bash
npx playwright test tests/auth-registration-login.spec.js --reporter=html
npx playwright show-report
```

### Option 5: Run Single Test File with Line Reporter
```bash
npx playwright test tests/auth-registration-login.spec.js --reporter=line
```

---

## Test Selectors Reference

### Registration Form Selectors
| Element | Selector | Type |
|---------|----------|------|
| Email input | `getByLabel('Email')` | Role-based |
| Password input | `getByLabel('Password')` | Role-based |
| Confirm Password | `getByLabel('Confirm Password')` | Role-based |
| Register button | `getByTestId('register-btn')` | data-testid |
| Sign In link | `getByRole('link', { name: /sign in/ })` | Role-based |

### Login Form Selectors
| Element | Selector | Type |
|---------|----------|------|
| Email input | `getByPlaceholder('you@email.com')` | Placeholder |
| Password input | `getByLabel('Password')` | Role-based |
| Login button | `locator('#login-btn')` | ID |
| Register link | `getByRole('link', { name: /register/ })` | Role-based |

### Home Page Selectors (Authenticated)
| Element | Selector | Type |
|---------|----------|------|
| Browse Events link | `getByRole('link', { name: /Browse Events/i })` | Role-based |

---

## Test Data

### Test Accounts
| Account | Email | Password | Status |
|---------|-------|----------|--------|
| Demo User | rahulshetty1@gmail.com | Magiclife1! | Pre-seeded (do not reuse) |
| Dynamic | Generated per test | Varies | Created during test |

**Important**: Each registration test generates a unique email using `Date.now()` to avoid conflicts.

---

## Understanding Test Assertions

### JWT Token Validation
```javascript
// Tests verify JWT token is stored in localStorage
const token = await page.evaluate(() => {
  return localStorage.getItem('eventhub_token');
});
expect(token).toBeTruthy();
```

### URL Assertions
- After successful login/registration: `http://localhost:3000/` (home page)
- After failed login/registration: `http://localhost:3000/login` or `/register` (same page)

### Error Message Assertions
Tests check for error messages using regex patterns:
- Invalid email: `/enter a valid email|invalid email/i`
- Weak password: `/password does not meet|requirements/i`
- Mismatched passwords: `/passwords do not match/i`
- Duplicate email: `/already exists|already registered|duplicate/i`

---

## Known Limitations & Considerations

1. **Base URL Configuration**: Tests use `http://localhost:3000` for local development. For production testing, update the `BASE_URL` constant.

2. **Demo Credentials**: The app contains a demo warning when using `rahulshetty1@gmail.com`. Tests use unique emails to bypass this.

3. **Password Expiry**: JWT tokens expire after 7 days. This suite doesn't test token refresh (out of scope for auth flow).

4. **Cross-Browser**: Tests are configured for Chromium only. To test other browsers, update `playwright.config.ts`.

5. **Rate Limiting**: If running many registrations quickly, backend rate limiting may trigger (not currently implemented in seed data).

---

## Debugging Failed Tests

If a test fails:

### Step 1: Check Error Message
Look at the failure output for:
- **Timeout**: Element not found, selector incorrect
- **AssertionError**: Value doesn't match expectation
- **NetworkError**: Backend not running

### Step 2: Use Debug Mode
```bash
npx playwright test tests/auth-registration-login.spec.js --debug
```

### Step 3: Verify Selectors
Open the app at `http://localhost:3000/login` and use browser dev tools:
```javascript
// Test in browser console
document.querySelector('#login-btn')  // Should return button element
```

### Step 4: Check Backend Logs
Ensure backend is running and check for API errors:
```bash
# Backend runs on port 3001
curl http://localhost:3001/health
```

---

## CI/CD Integration

To run these tests in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Install dependencies
  run: npm run setup

- name: Start application
  run: npm run dev &

- name: Wait for app to start
  run: sleep 5

- name: Run e2e tests
  run: npx playwright test tests/auth-registration-login.spec.js --reporter=github
```

---

## Next Steps

1. ✅ Install Node.js and run tests
2. ✅ Verify all tests pass locally
3. ✅ Review business rules in `.claude/skills/eventhub-domain/business-rules.md`
4. ✅ Extend tests for admin registration flows (optional)
5. ✅ Add API-layer testing (optional)

---

## Support

For issues or questions:
- Check test output for detailed error messages
- Review `.claude/skills/playwright-best-practices/SKILL.md` for test standards
- Inspect `frontend/app/login/page.tsx` and `frontend/app/register/page.tsx` for form structure
- Consult `.claude/skills/eventhub-domain/api-reference.md` for API validation rules
