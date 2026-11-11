import { expect, test } from '@playwright/test';
import { ALL_ROUTES, skipOpening, stubTurnstile } from './helpers.ts';

// Deterministic: Turnstile's real widget is exercised only by the form tests.
test.beforeEach(async ({ page }) => {
  await stubTurnstile(page);
  await skipOpening(page);
});

test('mobile: hero text first, the wall on posters, a shortcut bar after the hero, no horizontal scroll', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('.muro .cam img').first()).toBeVisible();
  // Koda's peek is a desktop detail; on a phone it stays out of the way.
  await expect(page.locator('.espia')).toBeHidden();
  const bar = page.locator('[data-barra]');
  await expect(bar).toBeHidden();
  await page.locator('#cenarios').scrollIntoViewIfNeeded();
  await expect(bar).toBeVisible();
  for (const a of await bar.locator('a').all()) {
    const box = await a.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
  }
  for (const tab of await page.locator('[data-abas] [role="tab"]').all())
    expect((await tab.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
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
  await skipOpening(page);
  for (const { path } of ALL_ROUTES) {
    await page.goto(path, { waitUntil: 'networkidle' });
    await page.locator('footer').scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
  await ctx.close();
});
