/**
 * Authentication E2E Tests
 * Validates the core login flow and protected route redirections using Playwright.
 */

import { test, expect } from '@playwright/test';

/**
 * Verification Test: Sign-In Page Rendering
 * Ensures that users who are NOT logged in are automatically redirected
 * from the home page to the sign-in page, and the login form is correctly parsed by the browser.
 */
test('should render sign-in page', async ({ page }) => {
  // 1. Visit the root of the application
  await page.goto('/');

  // 2. The middleware should trigger a redirect since the user is not authenticated
  // Wait for the URL change until it matches the sign-in route
  await page.waitForURL(/.*sign-in/);

  // 3. ASSERTION: Check for presence of key Sign-In UI elements
  // Verify the main header text exists
  await expect(page.locator('h2')).toContainText('Sign In');

  // Verify the specific form labels are rendered correctly for user visibility
  await expect(page.locator('label:has-text("Email Address")')).toBeVisible();
});
