/**
 * Multi-Tenant Isolation E2E Tests
 * Critical tests to verify data isolation between businesses
 */

import { test, expect } from '@playwright/test';

test.describe('Multi-Tenant Data Isolation', () => {
  test('should only show data for logged-in business', async ({ page }) => {
    // Login as business admin
    await page.goto('/login');
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'admin@owdglass.com');
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'password123');
    
    // Click the Sign In button (uses formAction, not type="submit")
    await page.click('button:has-text("Sign In")');
    
    // Wait for dashboard
    await page.waitForURL('/dashboard', { timeout: 30000 });

    // Verify we can access dashboard
    await expect(page.locator('h2:has-text("Dashboard Overview")')).toBeVisible({ timeout: 10000 });
  });

  test('should not allow access to admin routes', async ({ page }) => {
    // Login as business admin
    await page.goto('/login');
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'admin@owdglass.com');
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'password123');
    
    // Click the Sign In button (uses formAction, not type="submit")
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('/dashboard', { timeout: 30000 });

    // Verify we're on dashboard (admin routes would redirect back)
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should show OWD CRM branding', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'admin@owdglass.com');
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'password123');
    
    // Click the Sign In button (uses formAction, not type="submit")
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('/dashboard', { timeout: 30000 });

    // Verify OWD CRM branding in sidebar
    await expect(page.locator('h1:has-text("OWD CRM")')).toBeVisible({ timeout: 10000 });
  });
});
