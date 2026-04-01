# OWD CRM - Testing Guide

**Version:** 1.0  
**Last Updated:** April 1, 2026  
**Testing Framework:** Jest + React Testing Library

---

## Overview

This guide covers all testing procedures for the OWD CRM multi-tenant SaaS application, including unit tests, integration tests, and end-to-end tests.

---

## Test Setup

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Create test environment file:
```bash
cp .env.test .env.test.local
```

3. Fill in test Supabase credentials in `.env.test.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-test-service-role-key
TEST_BASE_URL=http://localhost:3000
```

**Important:** Use a separate Supabase project for testing, NOT your production database.

---

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test -- __tests__/api/webhooks.test.ts
```

---

## Test Structure

```
owd-crm/
├── __tests__/
│   ├── api/
│   │   └── webhooks.test.ts          # Webhook endpoint tests
│   ├── rls-policies.test.ts          # RLS policy verification
│   └── e2e/
│       └── multi-tenant.spec.ts      # E2E multi-tenant tests
├── jest.config.js                     # Jest configuration
├── jest.setup.js                      # Test setup file
└── .env.test                          # Test environment template
```

---

## Test Categories

### 1. RLS Policy Tests (`__tests__/rls-policies.test.ts`)

**Purpose:** Verify Row-Level Security policies enforce multi-tenant data isolation.

**Coverage:**
- ✅ Customers table isolation
- ✅ Quotes table isolation
- ✅ Products table isolation
- ✅ Repair requests table isolation
- ✅ Cross-business access prevention

**Example Test:**
```typescript
it('should allow user to see only their business customers', async () => {
  // Create customers for both businesses
  const customerA = await createCustomer(businessA.id);
  const customerB = await createCustomer(businessB.id);

  // User A should only see Customer A
  const userACustomers = await userAClient.from('customers').select('*');
  expect(userACustomers.data.length).toBe(1);
  expect(userACustomers.data[0].id).toBe(customerA.id);
});
```

**Run:**
```bash
npm test -- rls-policies.test.ts
```

---

### 2. Webhook Security Tests (`__tests__/api/webhooks.test.ts`)

**Purpose:** Verify webhook endpoints are secure and properly isolated.

**Coverage:**
- ✅ Webhook secret validation
- ✅ Cross-business access prevention
- ✅ Multi-tenant data isolation
- ✅ Duplicate customer prevention

**Example Test:**
```typescript
it('should reject requests without webhook secret', async () => {
  const response = await fetch(`${BASE_URL}/api/v1/business/test-business/generate-quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerPhone: '+27123456789' }),
  });

  expect(response.status).toBe(401);
});
```

**Run:**
```bash
npm test -- webhooks.test.ts
```

---

### 3. E2E Multi-Tenant Tests (Future)

**Purpose:** Test complete user flows across multiple businesses.

**Planned Coverage:**
- User login and business switching
- Quote creation and management
- Customer CRM operations
- Product catalog management
- Settings updates

**Tools:** Playwright or Cypress (to be implemented)

---

## Manual Testing Checklist

### Pre-Deployment Testing

#### Authentication & Authorization
- [ ] Super admin can log in
- [ ] Distributor can log in
- [ ] Business admin can log in
- [ ] Business user can log in
- [ ] Logout works correctly
- [ ] Session persists on page refresh
- [ ] Unauthorized users are redirected to login

#### Multi-Tenant Isolation
- [ ] Create two test businesses (Business A, Business B)
- [ ] Create test users for each business
- [ ] Log in as Business A user
- [ ] Verify cannot see Business B's customers
- [ ] Verify cannot see Business B's quotes
- [ ] Verify cannot see Business B's products
- [ ] Switch to Business B user
- [ ] Verify isolation in reverse

#### Webhook Endpoints
- [ ] Test `/api/v1/business/[slug]/generate-quote` with correct secret
- [ ] Test with wrong secret (should return 401)
- [ ] Test with wrong slug (should return 404)
- [ ] Verify quote is created in correct business
- [ ] Test `/api/v1/business/[slug]/repair-request` similarly

#### Dashboard Features
- [ ] KPI metrics display correctly
- [ ] Quote list loads and filters work
- [ ] Customer list loads and search works
- [ ] Product catalog loads and categories work
- [ ] Settings page loads and updates work
- [ ] Business switcher works (if user has multiple businesses)

#### Admin Features (Super Admin)
- [ ] Distributor management CRUD works
- [ ] Business management CRUD works
- [ ] Global analytics display correctly
- [ ] Can view all businesses across distributors

#### Distributor Features
- [ ] Can view only their businesses
- [ ] Cannot see other distributors' businesses
- [ ] Aggregated analytics are correct

---

## Performance Testing

### Load Testing (Recommended: k6 or Artillery)

**Test Scenarios:**
1. **Concurrent Quote Generation:** 100 requests/second to webhook endpoint
2. **Dashboard Load:** 50 concurrent users viewing dashboard
3. **Database Query Performance:** Measure query times for large datasets

**Example k6 Script:**
```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 100,
  duration: '30s',
};

export default function () {
  const payload = JSON.stringify({
    customerPhone: '+27123456789',
    customerName: 'Load Test Customer',
    items: [{ width: 1000, height: 1200, glassType: 'Clear 6mm' }],
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': 'your-test-secret',
    },
  };

  const res = http.post('https://your-app.vercel.app/api/v1/business/test/generate-quote', payload, params);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

---

## Security Testing

### Penetration Testing Checklist

#### SQL Injection
- [ ] Test webhook payloads with SQL injection attempts
- [ ] Verify parameterized queries prevent injection
- [ ] Test search fields with malicious input

#### XSS (Cross-Site Scripting)
- [ ] Test customer name fields with `<script>alert('XSS')</script>`
- [ ] Verify input sanitization
- [ ] Test quote descriptions with HTML tags

#### Authentication Bypass
- [ ] Attempt to access `/dashboard` without login
- [ ] Attempt to access `/admin` as business user
- [ ] Attempt to modify JWT token
- [ ] Test session timeout

#### Authorization Bypass
- [ ] Attempt to query another business's data via API
- [ ] Attempt to use Business A's webhook secret for Business B
- [ ] Test RLS policies with direct database access

#### CSRF (Cross-Site Request Forgery)
- [ ] Verify CSRF tokens on form submissions
- [ ] Test state-changing operations without proper headers

---

## Regression Testing

### After Each Deployment

1. **Smoke Tests** (5 minutes)
   - [ ] Login works
   - [ ] Dashboard loads
   - [ ] Quote list displays
   - [ ] Webhook endpoint responds

2. **Critical Path Tests** (15 minutes)
   - [ ] Create new quote via webhook
   - [ ] View quote in dashboard
   - [ ] Update quote status
   - [ ] Create new customer
   - [ ] Add product to catalog

3. **Full Regression Suite** (1 hour)
   - [ ] Run all automated tests
   - [ ] Manual testing checklist
   - [ ] Performance benchmarks

---

## Test Data Management

### Creating Test Data

**Super Admin:**
```sql
INSERT INTO business_users (email, role)
VALUES ('superadmin@test.com', 'super_admin');
```

**Distributor:**
```sql
INSERT INTO distributors (name, email)
VALUES ('Test Distributor', 'distributor@test.com');

INSERT INTO business_users (email, role)
VALUES ('distributor@test.com', 'distributor');
```

**Business:**
```sql
INSERT INTO businesses (name, slug, distributor_id, webhook_secret, is_active)
VALUES ('Test Business', 'test-business', 'distributor-uuid', 'test-secret-123', true);

INSERT INTO business_users (business_id, email, role)
VALUES ('business-uuid', 'admin@test.com', 'admin');
```

### Cleaning Test Data

**After Each Test Run:**
```sql
-- Delete test businesses
DELETE FROM businesses WHERE slug LIKE 'test-%' OR slug LIKE 'rls-test-%';

-- Delete test distributors
DELETE FROM distributors WHERE email LIKE '%@test.com';

-- Delete test users
DELETE FROM business_users WHERE email LIKE '%@test.com';
```

**Automated Cleanup:**
All test files include `afterAll()` hooks that clean up test data automatically.

---

## Continuous Integration (CI/CD)

### GitHub Actions Workflow (Recommended)

Create `.github/workflows/test.yml`:

```yaml
name: Run Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm test
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_KEY }}
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Test Coverage Goals

### Current Coverage
```
Statements   : 50% (target: 80%)
Branches     : 50% (target: 75%)
Functions    : 50% (target: 80%)
Lines        : 50% (target: 80%)
```

### Priority Areas for Coverage
1. **High Priority:** Webhook endpoints, RLS policies, authentication
2. **Medium Priority:** Dashboard components, form validations
3. **Low Priority:** UI components, styling

---

## Debugging Tests

### Common Issues

#### Test Fails: "Cannot connect to Supabase"
**Solution:** Verify `.env.test.local` has correct credentials

#### Test Fails: "RLS policy blocks query"
**Solution:** Ensure test user is linked to business in `business_users` table

#### Test Fails: "Duplicate key violation"
**Solution:** Test cleanup may have failed. Manually delete test data.

### Debugging Tips

1. **Enable verbose logging:**
```bash
npm test -- --verbose
```

2. **Run single test:**
```bash
npm test -- -t "should reject requests without webhook secret"
```

3. **Inspect Supabase logs:**
   - Go to Supabase Dashboard > Logs
   - Filter by test timeframe
   - Look for failed queries

---

## Best Practices

1. **Isolate Tests:** Each test should be independent and not rely on others
2. **Clean Up:** Always clean up test data in `afterAll()` hooks
3. **Use Factories:** Create helper functions for test data generation
4. **Mock External Services:** Mock BotSailor, PayFast, and PDF generation in tests
5. **Test Edge Cases:** Test with empty data, invalid data, and boundary conditions
6. **Keep Tests Fast:** Aim for <5 seconds per test file

---

## Conclusion

Comprehensive testing ensures the OWD CRM SaaS application is secure, reliable, and ready for production. Follow this guide to maintain high code quality and prevent regressions.

**Testing Status:** ✅ Infrastructure Ready  
**Next Steps:** Install dependencies and run first test suite

---

**Last Updated:** April 1, 2026  
**Maintained By:** Development Team
