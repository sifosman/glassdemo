/**
 * Authentication Helper for E2E Tests
 * Provides reusable login functionality
 */

import { Page } from '@playwright/test';

export async function login(page: Page) {
  // Navigate to login page
  await page.goto('/login');
  
  // Fill in credentials
  await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'admin@owdglass.com');
  await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'password123');
  
  // Click the Sign In button (uses formAction, not type="submit")
  await page.click('button:has-text("Sign In")');
  
  // Wait for redirect to dashboard after login
  await page.waitForURL('/dashboard', { timeout: 30000 });
  
  // Wait for sidebar to be visible (ensures app is fully loaded)
  await page.waitForSelector('aside:has-text("OWD CRM")', { state: 'visible', timeout: 10000 });
}
