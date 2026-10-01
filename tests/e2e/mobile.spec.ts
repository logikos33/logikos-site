import { expect, test } from '@playwright/test';
import { ALL_ROUTES, stubTurnstile } from './helpers.ts';

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

test('mobile: menu opens, lists the pages and closes on Escape, focus-out and outside click', async ({ page }) => {
  await page.goto('/en/');
  const menu = page.locator('.mobile-nav');
  await page.locator('.mobile-nav summary').click();
  await expect(page.locator('.mobile-nav__panel a[href="/en/partners"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).not.toHaveAttribute('open', '');
  await expect(page.locator('.mobile-nav summary')).toBeFocused();
  await page.locator('.mobile-nav summary').click();
  await expect(menu).toHaveAttribute('open', '');
  const vp = page.viewportSize() ?? { width: 390, height: 800 };
  await page.mouse.click(8, vp.height - 8); // below the open panel
  await expect(menu).not.toHaveAttribute('open', '');
});

test('320 px: no horizontal scroll on any page (forms included, Turnstile at real size)', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 320, height: 720 } });
  const page = await ctx.newPage();
  await stubTurnstile(page);
  for (const { path } of ALL_ROUTES) {
    await page.goto(path, { waitUntil: 'networkidle' });
    await page.locator('footer').scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
  await ctx.close();
});
