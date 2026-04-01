# Test Setup Guide

## Prerequisites for Running E2E Tests

The Playwright E2E tests require a valid test user account in your Supabase database.

### Option 1: Use Existing User (Recommended)

If you already have a user account in your Supabase database:

1. **Create `.env.playwright.local` file:**
   ```bash
   cp .env.playwright .env.playwright.local
   ```

2. **Add your test credentials:**
   ```env
   TEST_USER_EMAIL=admin@owdglass.com
   TEST_USER_PASSWORD=your-actual-password-here
   PLAYWRIGHT_BASE_URL=http://localhost:3000
   ```

3. **Update Playwright config to use the env file:**
   The tests will automatically use these credentials.

### Option 2: Create a Test User

If you need to create a new test user:

1. **Via Supabase Dashboard:**
   - Go to Authentication > Users
   - Click "Add User"
   - Email: `test@owdglass.com`
   - Password: `TestPassword123!`
   - Auto-confirm user: Yes

2. **Add to business_users table:**
   ```sql
   -- Get the user ID from auth.users
   SELECT id FROM auth.users WHERE email = 'test@owdglass.com';
   
   -- Insert into business_users (replace USER_ID and BUSINESS_ID)
   INSERT INTO business_users (id, business_id, email, role)
   VALUES (
     'USER_ID_FROM_ABOVE',
     (SELECT id FROM businesses LIMIT 1),
     'test@owdglass.com',
     'admin'
   );
   ```

3. **Update `.env.playwright.local`:**
   ```env
   TEST_USER_EMAIL=test@owdglass.com
   TEST_USER_PASSWORD=TestPassword123!
   ```

### Option 3: Skip Authentication (Quick Test)

For a quick test without proper authentication, you can modify the tests to use a mock session. However, this is not recommended for production testing.

---

## Running the Tests

### 1. Start Development Server
```bash
npm run dev
```

### 2. Run Tests (in a new terminal)

**With UI (Recommended for debugging):**
```bash
npm run test:e2e:ui
```

**Headed mode (watch browser):**
```bash
npm run test:e2e:headed
```

**Headless (CI mode):**
```bash
npm run test:e2e
```

**Run specific test file:**
```bash
npx playwright test e2e/dashboard.spec.ts
```

**Run specific browser:**
```bash
npx playwright test --project=chromium
```

---

## Troubleshooting

### Tests Timeout on Login
- **Cause:** Invalid credentials or user doesn't exist
- **Fix:** Verify credentials in `.env.playwright.local` match a real user

### "Cannot find business_id" Error
- **Cause:** User exists in auth.users but not in business_users table
- **Fix:** Add user to business_users table (see Option 2 above)

### Tests Pass on Chromium but Fail on Firefox/WebKit
- **Cause:** Browser-specific timing issues
- **Fix:** Increase timeout values or run only Chromium tests:
  ```bash
  npx playwright test --project=chromium
  ```

### "Page did not redirect to /dashboard"
- **Cause:** Login failed or middleware blocking
- **Fix:** Check browser console in headed mode for errors

---

## Current Test Status

**User Account Required:**
- Email: `admin@owdglass.com` (exists in database)
- Password: **NEEDS TO BE SET** in `.env.playwright.local`

**Next Steps:**
1. Add the actual password to `.env.playwright.local`
2. Run tests with `npm run test:e2e:ui`
3. Fix any failing assertions based on actual UI
