import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { ALL_ROUTES, setTheme, stubTurnstile } from './helpers.ts';

// Deterministic: Turnstile's real widget is exercised only by the form tests.
test.beforeEach(async ({ page }) => stubTurnstile(page));

test('light theme by default, even when the OS prefers dark', async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: 'dark' });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await ctx.close();
});

test('theme toggle persists across reload and navigation', async ({ page }) => {
  await page.goto('/');
  const toggle = page.locator('[data-theme-toggle]');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  const name = await toggle.getAttribute('aria-label');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  // Fixed accessible name; only the pressed state changes.
  await expect(toggle).toHaveAttribute('aria-label', name ?? '');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.goto('/en/about');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('[data-theme-toggle]').click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
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
  await page.goto('/');
  expect(seen).toEqual(['dark']);
});

for (const theme of ['light', 'dark'] as const) {
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

test('icon swaps show exactly one icon (theme toggle, mobile menu)', async ({ page }) => {
  await page.goto('/');
  const visibleIcons = (sel: string) =>
    page.locator(`${sel} svg`).evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== 'none').length);
  expect(await visibleIcons('[data-theme-toggle]')).toBe(1);
  await page.locator('[data-theme-toggle]').click();
  expect(await visibleIcons('[data-theme-toggle]')).toBe(1);
  await page.setViewportSize({ width: 390, height: 800 });
  expect(await visibleIcons('.mobile-nav summary')).toBe(1);
  await page.locator('.mobile-nav summary').click();
  expect(await visibleIcons('.mobile-nav summary')).toBe(1);
});

test('header wordmark keeps at least 90 px of ink (brand minimum)', async ({ page }) => {
  for (const width of [1440, 360]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    const ink = await page.locator('.site-header__logo .lk-wordmark').evaluate((el) => {
      const r = document.createRange();
      r.selectNodeContents(el);
      return r.getBoundingClientRect().width - (parseFloat(getComputedStyle(el).letterSpacing) || 0);
    });
    expect(ink, `width ${width}`).toBeGreaterThanOrEqual(90);
  }
});
