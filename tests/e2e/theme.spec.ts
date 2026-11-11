import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { ALL_ROUTES, setTheme, skipOpening } from './helpers.ts';

test.beforeEach(async ({ page }) => {
  await skipOpening(page);
});

// Feedback 11/11 (item 5): every page follows the dark v3 home — no toggle, the OS preference and
// an old saved choice are ignored.
test('every page is dark, with no toggle, whatever the OS or a saved choice say', async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: 'light' });
  const page = await ctx.newPage();
  await setTheme(page, 'light');
  await skipOpening(page);
  for (const { path } of ALL_ROUTES) {
    await page.goto(path);
    await expect(page.locator('html'), path).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('[data-theme-toggle]'), path).toHaveCount(0);
  }
  await ctx.close();
});

test('no flash of the wrong theme: data-theme is set before first paint', async ({ page }) => {
  await setTheme(page, 'dark');
  const seen: string[] = [];
  await page.exposeFunction('reportTheme', (t: string) => seen.push(t));
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      (window as unknown as { reportTheme: (t: string) => void }).reportTheme(document.documentElement.getAttribute('data-theme') ?? '');
    });
  });
  await page.goto('/sobre');
  expect(seen).toEqual(['dark']);
});

for (const theme of ['dark'] as const) {
  test(`axe: zero violations (WCAG 2 A/AA, incl. contrast) on all 20 pages — ${theme}`, async ({ page }, info) => {
    test.setTimeout(240_000);
    await setTheme(page, theme);
    const report: { path: string; violations: unknown[] }[] = [];
    for (const { path } of ALL_ROUTES) {
      await page.goto(path, { waitUntil: 'networkidle' });
      // Let the HUD settle so overlay chips are part of the scan.
      await page.waitForTimeout(300);
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      report.push({ path, violations: result.violations });
    }
    await info.attach(`axe-${theme}.json`, { body: JSON.stringify(report, null, 2), contentType: 'application/json' });
    const failing = report.filter((r) => r.violations.length > 0);
    expect(failing, JSON.stringify(failing, null, 2)).toEqual([]);
  });
}

test('icon swaps show exactly one icon (mobile menu)', async ({ page }) => {
  await page.goto('/sobre');
  const visibleIcons = (sel: string) =>
    page.locator(`${sel} svg`).evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== 'none').length);
  await page.setViewportSize({ width: 390, height: 800 });
  expect(await visibleIcons('.mobile-nav summary')).toBe(1);
  await page.locator('.mobile-nav summary').click();
  expect(await visibleIcons('.mobile-nav summary')).toBe(1);
});

test('header wordmark keeps at least 90 px of ink (brand minimum)', async ({ page }) => {
  for (const width of [1440, 360]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/sobre');
    const ink = await page
      .locator('.site-header__logo svg[data-brand="wordmark"]')
      .first()
      .evaluate((el) => el.getBoundingClientRect().width);
    expect(ink, `width ${width}`).toBeGreaterThanOrEqual(90);
  }
});

test('axe: the home opening (dialog over an inert page) has zero violations', async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('[data-abertura]')).toBeVisible();
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(result.violations, JSON.stringify(result.violations, null, 2)).toEqual([]);
  await ctx.close();
});
