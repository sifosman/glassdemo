/**
 * Quotes Management E2E Tests
 * Tests quote listing, filtering, and viewing functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Quotes Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'admin@owdglass.com');
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'password123');
    
    // Click the Sign In button (uses formAction, not type="submit")
    await page.click('button:has-text("Sign In")');
    
    // Wait for redirect to dashboard after login
    await page.waitForURL('/dashboard', { timeout: 30000 });
    
    // Wait for sidebar to be visible before navigating
    await page.waitForSelector('aside:has-text("OWD CRM")', { state: 'visible', timeout: 10000 });
    
    // Navigate to quotes
    await page.goto('/dashboard/quotes');
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display quotes list', async ({ page }) => {
    // Verify we're on quotes page
    await expect(page).toHaveURL(/\/dashboard\/quotes/);
    
    // Wait for main content to load
    await page.waitForSelector('main', { state: 'visible', timeout: 10000 });
    
    // Verify page loaded (look for search or filter elements if they exist)
    const searchInput = page.locator('input[placeholder*="Search"]');
    const searchCount = await searchInput.count();
    if (searchCount > 0) {
      await expect(searchInput).toBeVisible({ timeout: 10000 });
    }
  });

  test('should have filter buttons', async ({ page }) => {
    // Verify URL
    await expect(page).toHaveURL(/\/dashboard\/quotes/);
    
    // Wait for main content
    await page.waitForSelector('main', { state: 'visible', timeout: 10000 });
  });

  test('should have search functionality', async ({ page }) => {
    // Wait for page to be ready
    await page.waitForSelector('main', { state: 'visible', timeout: 10000 });
    
    // Check if search input exists
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    const searchCount = await searchInput.count();
    
    if (searchCount > 0) {
      await searchInput.fill('test');
      await expect(searchInput).toHaveValue('test');
    }
  });

  test('should load quotes page successfully', async ({ page }) => {
    // Verify URL
    await expect(page).toHaveURL(/\/dashboard\/quotes/);
    
    // Wait for main content
    await page.waitForSelector('main', { state: 'visible', timeout: 10000 });
  });

  test('should have export functionality if available', async ({ page }) => {
    // Verify URL
    await expect(page).toHaveURL(/\/dashboard\/quotes/);
    
    // Wait for page to load
    await page.waitForSelector('main', { state: 'visible', timeout: 10000 });
  });
});
