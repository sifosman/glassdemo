# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Dashboard >> should navigate to settings page
- Location: e2e\dashboard.spec.ts:81:7

# Error details

```
TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('aside nav a') to be visible

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]
  - generic [ref=e3]:
    - complementary [ref=e4]:
      - generic [ref=e5]:
        - heading "OWD CRM" [level=1] [ref=e6]
        - paragraph [ref=e7]: Loading...
      - navigation [ref=e8]
      - button "logout Logout" [ref=e10] [cursor=pointer]:
        - generic [ref=e11]: logout
        - generic [ref=e12]: Logout
    - main [ref=e13]:
      - generic [ref=e14]:
        - generic [ref=e16]:
          - generic [ref=e17]: search
          - textbox "Search glass specs, quotes..." [ref=e18]
        - generic [ref=e19]:
          - button "notifications" [ref=e20] [cursor=pointer]:
            - generic [ref=e21]: notifications
          - button "help" [ref=e22] [cursor=pointer]:
            - generic [ref=e23]: help
          - button "dark_mode" [ref=e24] [cursor=pointer]:
            - generic [ref=e25]: dark_mode
          - generic [ref=e27]: person
      - generic [ref=e28]:
        - generic [ref=e29]:
          - generic [ref=e30]:
            - navigation [ref=e31]:
              - generic [ref=e32]: CRM
              - generic [ref=e33]: chevron_right
              - generic [ref=e34]: Dashboard
            - heading "Dashboard Overview" [level=2] [ref=e35]
          - button "add New Quote" [ref=e36] [cursor=pointer]:
            - generic [ref=e37]: add
            - text: New Quote
        - generic [ref=e38]:
          - generic [ref=e39]:
            - generic [ref=e40]:
              - generic [ref=e42]: payments
              - generic [ref=e43]:
                - generic [ref=e44]: trending_up
                - text: +12.5%
            - paragraph [ref=e45]: Total Revenue
            - generic [ref=e46]:
              - generic [ref=e47]: $
              - generic [ref=e48]: "0"
          - generic [ref=e56]:
            - generic [ref=e57]:
              - generic [ref=e59]: description
              - generic [ref=e60]:
                - generic [ref=e61]: horizontal_rule
                - text: Static
            - paragraph [ref=e62]: Pending Quotes
            - text: "0"
          - generic [ref=e70]:
            - generic [ref=e71]:
              - generic [ref=e73]: person_check
              - generic [ref=e74]:
                - generic [ref=e75]: trending_up
                - text: "+0"
            - paragraph [ref=e76]: Active Customers
            - text: "0"
            - generic [ref=e78]: "+0"
          - generic [ref=e79]:
            - generic [ref=e80]:
              - generic [ref=e82]: auto_graph
              - generic [ref=e83]:
                - generic [ref=e84]: horizontal_rule
                - text: 0%
            - paragraph [ref=e85]: Conversion Rate
            - text: 0%
        - generic [ref=e87]:
          - generic [ref=e89]:
            - generic [ref=e90]:
              - heading "history Recent Activity" [level=3] [ref=e91]:
                - generic [ref=e92]: history
                - text: Recent Activity
              - button "View All" [ref=e93] [cursor=pointer]
            - generic [ref=e95]:
              - generic [ref=e96]: inbox
              - paragraph [ref=e97]: No recent activity found.
              - paragraph [ref=e98]: Activity will appear here as you use the system.
          - generic [ref=e99]:
            - generic [ref=e100]:
              - heading "bolt Quick Actions" [level=3] [ref=e101]:
                - generic [ref=e102]: bolt
                - text: Quick Actions
              - generic [ref=e103]:
                - button "receipt Create Invoice arrow_forward" [ref=e104] [cursor=pointer]:
                  - generic [ref=e105]:
                    - generic [ref=e106]: receipt
                    - generic [ref=e107]: Create Invoice
                  - generic [ref=e108]: arrow_forward
                - button "person_add Add Customer arrow_forward" [ref=e109] [cursor=pointer]:
                  - generic [ref=e110]:
                    - generic [ref=e111]: person_add
                    - generic [ref=e112]: Add Customer
                  - generic [ref=e113]: arrow_forward
                - button "summarize Generate Report arrow_forward" [ref=e114] [cursor=pointer]:
                  - generic [ref=e115]:
                    - generic [ref=e116]: summarize
                    - generic [ref=e117]: Generate Report
                  - generic [ref=e118]: arrow_forward
            - generic [ref=e119]:
              - generic [ref=e120]:
                - generic [ref=e121]: System Active
                - heading "Getting Started" [level=4] [ref=e123]
                - paragraph [ref=e124]: Start by creating your first quote or adding a customer to the system.
                - button "View Guide" [ref=e125] [cursor=pointer]
              - generic [ref=e127]: lightbulb
```

# Test source

```ts
  1   | /**
  2   |  * Dashboard E2E Tests
  3   |  * Tests core dashboard functionality and navigation
  4   |  */
  5   | 
  6   | import { test, expect } from '@playwright/test';
  7   | 
  8   | test.describe('Dashboard', () => {
  9   |   test.beforeEach(async ({ page }) => {
  10  |     // Login first
  11  |     await page.goto('/login');
  12  |     await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'admin@owdglass.com');
  13  |     await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'password123');
  14  |     
  15  |     // Click the Sign In button (uses formAction, not type="submit")
  16  |     await page.click('button:has-text("Sign In")');
  17  |     
  18  |     // Wait for redirect to dashboard
  19  |     await page.waitForURL('/dashboard', { timeout: 30000 });
  20  |     
  21  |     // Wait for sidebar to be visible
  22  |     await page.waitForSelector('aside:has-text("OWD CRM")', { state: 'visible', timeout: 10000 });
  23  |     
  24  |     // Wait for sidebar to finish loading (navigation links should be visible)
  25  |     // The sidebar shows "Loading..." while fetching user role/permissions
> 26  |     await page.waitForSelector('aside nav a', { state: 'visible', timeout: 15000 });
      |                ^ TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
  27  |   });
  28  | 
  29  |   test('should display dashboard with KPI metrics', async ({ page }) => {
  30  |     // Verify dashboard header
  31  |     await expect(page.locator('h2:has-text("Dashboard Overview")')).toBeVisible({ timeout: 10000 });
  32  | 
  33  |     // Verify KPI cards are visible
  34  |     await expect(page.locator('text=Total Revenue')).toBeVisible();
  35  |   });
  36  | 
  37  |   test('should navigate to quotes page', async ({ page }) => {
  38  |     // Click on Quotes link in sidebar
  39  |     await page.locator('aside a[href="/dashboard/quotes"]').click();
  40  | 
  41  |     // Verify navigation
  42  |     await expect(page).toHaveURL(/\/dashboard\/quotes/, { timeout: 10000 });
  43  |     
  44  |     // Wait for page to load
  45  |     await page.waitForSelector('main', { state: 'visible', timeout: 10000 });
  46  |   });
  47  | 
  48  |   test('should navigate to customers page', async ({ page }) => {
  49  |     // Click on Customers link in sidebar
  50  |     await page.locator('aside a[href="/dashboard/customers"]').click();
  51  | 
  52  |     // Verify navigation
  53  |     await expect(page).toHaveURL(/\/dashboard\/customers/, { timeout: 10000 });
  54  |     
  55  |     // Wait for page to load
  56  |     await page.waitForSelector('main', { state: 'visible', timeout: 10000 });
  57  |   });
  58  | 
  59  |   test('should navigate to products page', async ({ page }) => {
  60  |     // Click on Products link in sidebar
  61  |     await page.locator('aside a[href="/dashboard/products"]').click();
  62  | 
  63  |     // Verify navigation
  64  |     await expect(page).toHaveURL(/\/dashboard\/products/, { timeout: 10000 });
  65  |     
  66  |     // Wait for page to load
  67  |     await page.waitForSelector('main', { state: 'visible', timeout: 10000 });
  68  |   });
  69  | 
  70  |   test('should navigate to invoices page', async ({ page }) => {
  71  |     // Click on Invoices link in sidebar
  72  |     await page.locator('aside a[href="/dashboard/invoices"]').click();
  73  | 
  74  |     // Verify navigation
  75  |     await expect(page).toHaveURL(/\/dashboard\/invoices/, { timeout: 10000 });
  76  |     
  77  |     // Wait for page to load
  78  |     await page.waitForSelector('main', { state: 'visible', timeout: 10000 });
  79  |   });
  80  | 
  81  |   test('should navigate to settings page', async ({ page }) => {
  82  |     // Click on Settings link in sidebar
  83  |     await page.locator('aside a[href="/dashboard/settings"]').click();
  84  | 
  85  |     // Verify navigation
  86  |     await expect(page).toHaveURL(/\/dashboard\/settings/, { timeout: 10000 });
  87  |     
  88  |     // Wait for page to load
  89  |     await page.waitForSelector('main', { state: 'visible', timeout: 10000 });
  90  |   });
  91  | 
  92  |   test('should display OWD CRM branding in sidebar', async ({ page }) => {
  93  |     // Verify sidebar branding
  94  |     await expect(page.locator('h1:has-text("OWD CRM")')).toBeVisible();
  95  |   });
  96  | 
  97  |   test('should logout successfully', async ({ page }) => {
  98  |     // Click logout button
  99  |     await page.locator('button:has-text("Logout")').click();
  100 | 
  101 |     // Verify redirect to login
  102 |     await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  103 |   });
  104 | });
  105 | 
```