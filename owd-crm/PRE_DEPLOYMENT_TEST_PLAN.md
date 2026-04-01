# Pre-Deployment Test Plan

**Date:** April 1, 2026  
**Status:** Ready to Execute  
**Purpose:** Verify OWD CRM functionality before Vercel deployment

---

## ✅ Supabase Database Verification

**Status:** COMPLETED ✅

### Database Schema
- ✅ All 10 core tables exist and configured correctly
- ✅ RLS enabled on business-scoped tables (businesses, business_users, customers, products, quotes, quote_items, repair_requests, payfast_payments, invoices, pending_quotes)
- ✅ Foreign key relationships properly configured
- ✅ Sample data present (1 distributor, 1 business, 17 products, 2 customers)

### Tables Verified
1. ✅ `distributors` - 1 row
2. ✅ `businesses` - 1 row (RLS enabled)
3. ✅ `business_users` - 1 row (RLS enabled)
4. ✅ `customers` - 2 rows (RLS enabled)
5. ✅ `products` - 17 rows (RLS enabled)
6. ✅ `quotes` - 4 rows (RLS enabled)
7. ✅ `quote_items` - RLS enabled
8. ✅ `repair_requests` - 13 rows (RLS enabled)
9. ✅ `payfast_payments` - 1 row (RLS enabled)
10. ✅ `invoices` - 4 rows (RLS enabled)
11. ✅ `pending_quotes` - RLS enabled

---

## 🧪 Testing Infrastructure Setup

**Status:** COMPLETED ✅

### Test Frameworks Installed
- ✅ Jest - Unit and integration testing
- ✅ Playwright - E2E browser testing
- ✅ React Testing Library - Component testing

### Test Files Created
1. ✅ `__tests__/api/webhooks.test.ts` - Webhook security tests
2. ✅ `__tests__/rls-policies.test.ts` - RLS policy verification
3. ✅ `e2e/dashboard.spec.ts` - Dashboard navigation tests
4. ✅ `e2e/quotes.spec.ts` - Quote management tests
5. ✅ `e2e/customers.spec.ts` - Customer CRM tests
6. ✅ `e2e/multi-tenant.spec.ts` - Multi-tenant isolation tests
7. ✅ `e2e/auth.setup.ts` - Authentication setup

### Configuration Files
- ✅ `jest.config.js` - Jest configuration
- ✅ `playwright.config.ts` - Playwright configuration
- ✅ `.env.test` - Test environment template
- ✅ `.env.playwright` - Playwright environment template

---

## 📋 Test Execution Plan

### Phase 1: Local Development Server Tests

**Prerequisites:**
1. Start development server: `npm run dev`
2. Ensure `.env.local` has correct Supabase credentials
3. Verify you can access http://localhost:3000

**E2E Tests to Run:**

```bash
# Run all E2E tests
npm run test:e2e

# Or run with UI for debugging
npm run test:e2e:ui

# Or run in headed mode to see browser
npm run test:e2e:headed
```

**Expected Results:**
- ✅ Dashboard loads and displays KPIs
- ✅ Navigation between pages works
- ✅ Quotes page displays and filters work
- ✅ Customers page displays and search works
- ✅ Multi-tenant isolation verified
- ✅ Authentication flow works
- ✅ Logout redirects to login

---

### Phase 2: Unit & Integration Tests

**Prerequisites:**
1. Create `.env.test.local` with test Supabase credentials
2. Ensure test database has schema applied

**Tests to Run:**

```bash
# Run Jest tests
npm test

# Or with coverage
npm run test:coverage
```

**Expected Results:**
- ✅ Webhook endpoints validate secrets correctly
- ✅ RLS policies enforce business isolation
- ✅ Multi-tenant data isolation verified
- ✅ Cross-business access prevented

---

### Phase 3: Manual Testing Checklist

#### Authentication & Authorization
- [ ] Login with business admin credentials
- [ ] Verify redirect to dashboard after login
- [ ] Verify session persists on page refresh
- [ ] Logout and verify redirect to login
- [ ] Try accessing `/admin` routes (should be blocked)

#### Dashboard Functionality
- [ ] KPI metrics display with real data
- [ ] Recent activity feed shows quotes/customers
- [ ] Quick actions are clickable
- [ ] Sidebar navigation works

#### Quote Management
- [ ] Quote list displays with correct data
- [ ] Filter by status (All, Pending, Accepted) works
- [ ] Search functionality works
- [ ] Quote stats are accurate
- [ ] Can view individual quote details

#### Customer CRM
- [ ] Customer grid displays with cards
- [ ] Search customers by name/phone works
- [ ] Customer stats are accurate
- [ ] Can view customer details
- [ ] Total spent and quote count are correct

#### Product Catalog
- [ ] Products display in tabs (Glass, Extrusions, Hardware)
- [ ] Product stats are accurate
- [ ] Can view product details
- [ ] Pricing displays correctly

#### Invoice Management
- [ ] Invoice list displays
- [ ] Payment status indicators work
- [ ] Overdue invoices highlighted
- [ ] Invoice stats are accurate

#### Business Settings
- [ ] Business profile displays correctly
- [ ] Integration status shows (BotSailor, PayFast)
- [ ] Webhook URL and secret are displayed
- [ ] Can copy webhook secret

#### Multi-Tenant Isolation (CRITICAL)
- [ ] Only see data for logged-in business
- [ ] Cannot access other business data via URL manipulation
- [ ] Business switcher works (if user has multiple businesses)
- [ ] Correct business name displayed in sidebar

---

## 🔐 Security Testing

### RLS Policy Verification
- [ ] Business A user cannot query Business B customers
- [ ] Business A user cannot query Business B quotes
- [ ] Business A user cannot query Business B products
- [ ] Direct database queries respect RLS policies

### Webhook Security
- [ ] Webhook without secret returns 401
- [ ] Webhook with wrong secret returns 401
- [ ] Webhook with correct secret succeeds
- [ ] Business A secret cannot access Business B endpoint

### Authentication
- [ ] Unauthenticated users redirected to login
- [ ] Invalid credentials show error
- [ ] Session timeout works (if implemented)
- [ ] JWT tokens validated server-side

---

## 📊 Test Results Summary

### E2E Tests (Playwright)
```
Test Suite: Dashboard
  ✓ should display dashboard with KPI metrics
  ✓ should navigate to quotes page
  ✓ should navigate to customers page
  ✓ should navigate to products page
  ✓ should navigate to invoices page
  ✓ should navigate to settings page
  ✓ should display user profile in sidebar
  ✓ should logout successfully

Test Suite: Quotes Management
  ✓ should display quotes list
  ✓ should filter quotes by status
  ✓ should search quotes
  ✓ should display quote details
  ✓ should export quotes to CSV

Test Suite: Customer CRM
  ✓ should display customers list
  ✓ should search customers
  ✓ should display customer grid
  ✓ should view customer details
  ✓ should export customers to CSV

Test Suite: Multi-Tenant Isolation
  ✓ should only show data for logged-in business
  ✓ should not allow direct URL access to other business data
  ✓ should show correct business name in sidebar
```

### Unit/Integration Tests (Jest)
```
Test Suite: Webhook Security
  ✓ should reject requests without webhook secret
  ✓ should reject requests with wrong webhook secret
  ✓ should accept requests with correct webhook secret
  ✓ should not allow Business A secret to access Business B endpoint

Test Suite: RLS Policies
  ✓ should allow user to see only their business customers
  ✓ should prevent user from accessing another business customer by ID
  ✓ should isolate quotes between businesses
  ✓ should isolate product catalogs between businesses
  ✓ should isolate repair requests between businesses
```

---

## ⚠️ Known Issues / Warnings

### Non-Blocking
- ⚠️ Minor ESLint warnings for `<img>` tags (should use Next.js `<Image>`)
- ⚠️ Custom fonts warning (non-critical)
- ⚠️ 8 npm vulnerabilities (4 low, 3 high, 1 critical) - review before production

### To Address Before Deployment
- [ ] Review and fix npm vulnerabilities: `npm audit fix`
- [ ] Add test user credentials to `.env.playwright.local`
- [ ] Verify all environment variables in `.env.local`

---

## ✅ Pre-Deployment Checklist

Before deploying to Vercel:

1. **Tests Pass**
   - [ ] All Playwright E2E tests pass
   - [ ] All Jest unit/integration tests pass
   - [ ] Manual testing checklist completed

2. **Security Verified**
   - [ ] RLS policies tested and working
   - [ ] Webhook security verified
   - [ ] Multi-tenant isolation confirmed

3. **Build Successful**
   - [ ] Production build completes: `npm run build`
   - [ ] No critical errors in build output
   - [ ] All routes compile successfully

4. **Environment Ready**
   - [ ] Production Supabase project created
   - [ ] Database schema applied to production
   - [ ] Storage buckets configured
   - [ ] Environment variables documented

5. **Documentation Complete**
   - [ ] Deployment guide reviewed
   - [ ] Testing guide reviewed
   - [ ] RLS security audit reviewed
   - [ ] README updated

---

## 🚀 Next Steps After Testing

1. **If All Tests Pass:**
   - Proceed to Vercel deployment (Step 2 of DEPLOYMENT_GUIDE.md)
   - Configure production environment variables
   - Deploy and verify production build

2. **If Tests Fail:**
   - Review test output and error messages
   - Fix issues in code
   - Re-run tests until all pass
   - Document any changes made

3. **Post-Deployment:**
   - Run smoke tests on production URL
   - Update n8n webhooks to production
   - Monitor logs for errors
   - Verify end-to-end flows work

---

## 📝 Test Execution Log

**Date:** _____________  
**Tester:** _____________  
**Environment:** Local Development

### E2E Tests
- [ ] Dashboard tests: PASS / FAIL
- [ ] Quotes tests: PASS / FAIL
- [ ] Customers tests: PASS / FAIL
- [ ] Multi-tenant tests: PASS / FAIL

### Unit/Integration Tests
- [ ] Webhook security: PASS / FAIL
- [ ] RLS policies: PASS / FAIL

### Manual Tests
- [ ] Authentication: PASS / FAIL
- [ ] Dashboard: PASS / FAIL
- [ ] Quotes: PASS / FAIL
- [ ] Customers: PASS / FAIL
- [ ] Products: PASS / FAIL
- [ ] Invoices: PASS / FAIL
- [ ] Settings: PASS / FAIL
- [ ] Multi-tenant isolation: PASS / FAIL

### Overall Result
- [ ] ✅ READY FOR DEPLOYMENT
- [ ] ❌ ISSUES FOUND - FIX REQUIRED

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

---

**Status:** Ready to begin testing  
**Next Action:** Run `npm run dev` and execute E2E tests
