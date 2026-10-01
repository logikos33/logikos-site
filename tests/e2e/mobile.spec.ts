import { expect, test } from '@playwright/test';
import { stubTurnstile } from './helpers.ts';

// Deterministic: Turnstile's real widget is exercised only by the form tests.
test.beforeEach(async ({ page }) => stubTurnstile(page));

test('mobile: hero text is visible before media, HUD waits for play, no horizontal scroll', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  const hud = page.locator('[data-hud][data-slot="hero"]');
  await hud.scrollIntoViewIfNeeded();
  await expect(hud).toHaveAttribute('data-state', 'idle');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('mobile: menu opens and lists the pages', async ({ page }) => {
  await page.goto('/en/');
  await page.locator('.mobile-nav summary').click();
  await expect(page.locator('.mobile-nav__panel a[href="/en/partners"]')).toBeVisible();
});
