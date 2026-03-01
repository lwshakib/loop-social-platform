import { test, expect } from '@playwright/test';

test('should render sign-in page', async ({ page }) => {
  await page.goto('/');
  // Since it redirects to sign-in if not authenticated
  // Wait for the URL to contain sign-in
  await page.waitForURL(/.*sign-in/);
  await expect(page.locator('h2')).toContainText('Sign In');
  await expect(page.locator('label:has-text("Email Address")')).toBeVisible();
});
