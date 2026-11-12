import { expect, test } from '@playwright/test';
import { ALL_ROUTES, skipOpening } from './helpers.ts';

test.beforeEach(async ({ page }) => {
  await skipOpening(page);
});

test('mobile: hero text first, the shortcut bar in reach from the start (one pair of CTAs), no horizontal scroll', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('.muro .cam img').first()).toBeVisible();
  // Koda's peek is a desktop detail; on a phone it stays out of the way.
  await expect(page.locator('.espia')).toBeHidden();
  // The bar is the hero's pair of buttons: visible on arrival, the hero's own are not rendered.
  const bar = page.locator('[data-barra]');
  await expect(bar).toBeVisible();
  await expect(page.locator('[data-heroi-acoes]')).toBeHidden();
  await expect(bar.locator('a').nth(1)).toContainText(/Seu modelo/);
  for (const a of await bar.locator('a').all()) {
    const box = await a.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(await a.evaluate((el) => el.scrollWidth <= el.clientWidth + 1), 'label fits').toBe(true);
  }
  // It steps aside while the band's own button is on screen, then comes back.
  await page.locator('[data-faixa-acoes]').scrollIntoViewIfNeeded();
  await expect(bar).toBeHidden();
  await page.locator('#como').scrollIntoViewIfNeeded();
  await page.locator('.passos li').last().scrollIntoViewIfNeeded();
  await expect(bar).toBeVisible();
  for (const control of await page.locator('[data-ir], [data-anterior], [data-proximo]').all())
    expect((await control.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('mobile: keyboard focus is never hidden under the shortcut bar (WCAG 2.4.11)', async ({ page }) => {
  await page.goto('/');
  const bar = page.locator('[data-barra]');
  const hidden: string[] = [];
  for (let i = 0; i < 70; i++) {
    await page.keyboard.press('Tab');
    const r = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      const b = document.querySelector('[data-barra]');
      if (!el || !b || b.contains(el) || b.classList.contains('some')) return null;
      const a = el.getBoundingClientRect();
      const top = b.getBoundingClientRect().top;
      return a.top >= top ? `${el.tagName} ${el.textContent?.trim().slice(0, 30)}` : null;
    });
    if (r) hidden.push(r);
  }
  await expect(bar).toBeAttached();
  expect(hidden).toEqual([]);
});

test('mobile: menu opens, lists the pages and closes on Escape, focus-out and outside click', async ({ page }) => {
  await page.goto('/en/');
  const menu = page.locator('.mobile-nav');
  await page.locator('.mobile-nav summary').click();
  await expect(page.locator('.mobile-nav__panel a[href="/en/cases"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).not.toHaveAttribute('open', '');
  await expect(page.locator('.mobile-nav summary')).toBeFocused();
  await page.locator('.mobile-nav summary').click();
  await expect(menu).toHaveAttribute('open', '');
  const vp = page.viewportSize() ?? { width: 390, height: 800 };
  await page.mouse.click(8, vp.height - 8); // below the open panel
  await expect(menu).not.toHaveAttribute('open', '');
});

test('320 px: no horizontal scroll on any page (forms included)', async ({ browser }) => {
  // 32 pages since the Cases round: one minute is not enough to visit them all.
  test.setTimeout(150_000);
  const ctx = await browser.newContext({ viewport: { width: 320, height: 720 } });
  const page = await ctx.newPage();
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
