import { expect, test } from '@playwright/test';
import { HTML_LANG, LOCALES, ROUTES } from '../../src/i18n/routes.ts';
import { ALL_ROUTES, SITE, expectNoConsoleErrors, stubTurnstile, trackConsole } from './helpers.ts';

// Deterministic: Turnstile's real widget is exercised only by the form tests.
test.beforeEach(async ({ page }) => stubTurnstile(page));

test('the route map has 12 pages per language', () => {
  expect(ALL_ROUTES).toHaveLength(24);
});

for (const { key, locale, path } of ALL_ROUTES) {
  test(`${path} renders with lang, canonical, hreflang and a working language switch`, async ({ page, request }) => {
    const errors = trackConsole(page);
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', HTML_LANG[locale]);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new URL(path, SITE).href);

    const alternates = await page
      .locator('link[rel="alternate"][hreflang]')
      .evaluateAll((els) => els.map((e) => [e.getAttribute('hreflang'), e.getAttribute('href')]));
    expect(alternates).toEqual([
      ...LOCALES.map((l) => [HTML_LANG[l], new URL(ROUTES[key][l], SITE).href]),
      ['x-default', new URL(ROUTES[key]['pt-br'], SITE).href],
    ]);

    const other = LOCALES.find((l) => l !== locale) ?? 'en';
    const switchLink = page.locator('[data-lang-link]');
    await expect(switchLink).toHaveAttribute('href', ROUTES[key][other]);
    expect((await request.get(ROUTES[key][other])).status()).toBe(200);

    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{40,}/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', new URL(`/og/${locale}/${key}.png`, SITE).href);
    await expectNoConsoleErrors(errors);
  });
}

test('every internal link resolves (no broken links)', async ({ page, request }) => {
  const seen = new Set<string>();
  for (const { path } of ALL_ROUTES) {
    await page.goto(path);
    const hrefs = await page.locator('a[href^="/"]').evaluateAll((els) => els.map((e) => e.getAttribute('href') ?? ''));
    hrefs.forEach((h) => seen.add(h.split('#')[0] ?? h));
  }
  for (const href of seen) {
    expect((await request.get(href)).status(), href).toBe(200);
  }
});

test('one OG image per page and language', async ({ request }) => {
  for (const { key, locale } of ALL_ROUTES) {
    const res = await request.get(`/og/${locale}/${key}.png`);
    expect(res.status(), `${locale}/${key}`).toBe(200);
    expect(res.headers()['content-type']).toContain('image/png');
  }
});

test('unknown paths return the 404 page', async ({ page }) => {
  const res = await page.goto('/nao-existe');
  expect(res?.status()).toBe(404);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});
