import { test, expect } from '@playwright/test';

test('search and open profile', async ({ page }) => {
  // Query deterministic seeded fixture
  await page.goto('/search?q=Playwright%20Fixture%20Mason', { waitUntil: 'networkidle' });
  // wait for results summary to appear (stable test id)
  await expect(page.locator('[data-testid="results-summary"]')).toBeVisible({ timeout: 20000 });
  // ensure at least one match badge exists
  const badges = page.locator('[data-testid="match-badge"]');
  await expect(badges.first()).toBeVisible({ timeout: 10000 });
  // click first expert card containing a match badge
  const firstCard = page.locator('a:has([data-testid="match-badge"])').first();
  await firstCard.click();
  await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
});

