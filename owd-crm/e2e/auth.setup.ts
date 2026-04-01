/**
 * Authentication Setup for Playwright Tests
 * Creates authenticated sessions for different user roles
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

setup('authenticate as business admin', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');

  // Fill in login credentials
  // TODO: Replace with your test user credentials
  await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'admin@owdglass.com');
  await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password123');

  // Click login button
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard');

  // Verify we're logged in
  await expect(page.locator('text=Dashboard')).toBeVisible();

  // Save authenticated state
  await page.context().storageState({ path: authFile });
});
