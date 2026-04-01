/**
 * Dashboard E2E Tests
 * Tests core dashboard functionality and navigation
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'admin@owdglass.com');
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'password123');
    
    // Click the Sign In button (uses formAction, not type="submit")
    await page.click('button:has-text("Sign In")');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 30000 });
    
    // Wait for sidebar to be visible
    await page.waitForSelector('aside:has-text("OWD CRM")', { state: 'visible', timeout: 10000 });
    
    // Wait for sidebar to finish loading (navigation links should be visible)
    // The sidebar shows "Loading..." while fetching user role/permissions
    await page.waitForSelector('aside nav a', { state: 'visible', timeout: 15000 });
  });

  test('should display dashboard with KPI metrics', async ({ page }) => {
    // Verify dashboard header
    await expect(page.locator('h2:has-text("Dashboard Overview")')).toBeVisible({ timeout: 10000 });

    // Verify KPI cards are visible
    await expect(page.locator('text=Total Revenue')).toBeVisible();
  });

  test('should navigate to quotes page', async ({ page }) => {
    // Click on Quotes link in sidebar
    await page.locator('aside a[href="/dashboard/quotes"]').click();

    // Verify navigation
    await expect(page).toHaveURL(/\/dashboard\/quotes/, { timeout: 10000 });
    
    // Wait for page to load
    await page.waitForSelector('main', { state: 'visible', timeout: 10000 });
  });

  test('should navigate to customers page', async ({ page }) => {
    // Click on Customers link in sidebar
    await page.locator('aside a[href="/dashboard/customers"]').click();

    // Verify navigation
    await expect(page).toHaveURL(/\/dashboard\/customers/, { timeout: 10000 });
    
    // Wait for page to load
    await page.waitForSelector('main', { state: 'visible', timeout: 10000 });
  });

  test('should navigate to products page', async ({ page }) => {
    // Click on Products link in sidebar
    await page.locator('aside a[href="/dashboard/products"]').click();

    // Verify navigation
    await expect(page).toHaveURL(/\/dashboard\/products/, { timeout: 10000 });
    
    // Wait for page to load
    await page.waitForSelector('main', { state: 'visible', timeout: 10000 });
  });

  test('should navigate to invoices page', async ({ page }) => {
    // Click on Invoices link in sidebar
    await page.locator('aside a[href="/dashboard/invoices"]').click();

    // Verify navigation
    await expect(page).toHaveURL(/\/dashboard\/invoices/, { timeout: 10000 });
    
    // Wait for page to load
    await page.waitForSelector('main', { state: 'visible', timeout: 10000 });
  });

  test('should navigate to settings page', async ({ page }) => {
    // Click on Settings link in sidebar
    await page.locator('aside a[href="/dashboard/settings"]').click();

    // Verify navigation
    await expect(page).toHaveURL(/\/dashboard\/settings/, { timeout: 10000 });
    
    // Wait for page to load
    await page.waitForSelector('main', { state: 'visible', timeout: 10000 });
  });

  test('should display OWD CRM branding in sidebar', async ({ page }) => {
    // Verify sidebar branding
    await expect(page.locator('h1:has-text("OWD CRM")')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Click logout button
    await page.locator('button:has-text("Logout")').click();

    // Verify redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
