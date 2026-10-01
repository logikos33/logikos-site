import { expect, test } from '@playwright/test';
import { HTML_LANG, LOCALES, ROUTES } from '../../src/i18n/routes.ts';
import { ALL_ROUTES, SITE, stubTurnstile } from './helpers.ts';

// Deterministic: Turnstile's real widget is exercised only by the form tests.
test.beforeEach(async ({ page }) => stubTurnstile(page));

test('sitemap lists all 20 pages, each with pt-BR, en and x-default alternates', async ({ request }) => {
  const index = await (await request.get('/sitemap-index.xml')).text();
  expect(index).toContain(new URL('/sitemap-0.xml', SITE).href);
  const xml = await (await request.get('/sitemap-0.xml')).text();
  const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1] ?? '');
  expect(urls).toHaveLength(20);
  for (const { key, path } of ALL_ROUTES) {
    const entry = urls.find((u) => u.includes(`<loc>${new URL(path, SITE).href}</loc>`));
    expect(entry, path).toBeTruthy();
    for (const l of LOCALES) {
      expect(entry).toContain(`hreflang="${HTML_LANG[l]}" href="${new URL(ROUTES[key][l], SITE).href}"`);
    }
    expect(entry).toContain(`hreflang="x-default" href="${new URL(ROUTES[key]['pt-br'], SITE).href}"`);
  }
  expect(xml).not.toContain('_marca');
  expect(xml).not.toContain('404');
});

test('hreflang is reciprocal across the whole site', async ({ page }) => {
  const graph = new Map<string, string[]>();
  for (const { path } of ALL_ROUTES) {
    await page.goto(path);
    const alts = await page
      .locator('link[rel="alternate"][hreflang]:not([hreflang="x-default"])')
      .evaluateAll((els) => els.map((e) => e.getAttribute('href') ?? ''));
    graph.set(new URL(path, SITE).href, alts);
  }
  for (const [self, alts] of graph) {
    expect(alts, `${self} must reference itself`).toContain(self);
    for (const alt of alts) expect(graph.get(alt), `${alt} must link back to ${self}`).toContain(self);
  }
});

test('robots.txt points at the sitemap and /_marca is noindex', async ({ request, page }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain(`Sitemap: ${new URL('/sitemap-index.xml', SITE).href}`);
  await page.goto('/_marca');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test('JSON-LD Organization carries the company facts', async ({ page }) => {
  await page.goto('/');
  const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}');
  expect(data['@type']).toBe('Organization');
  expect(data.name).toBe('Logikos Soluções');
  expect(data.taxID).toBe('46.448.212/0001-37');
  expect(data.address.addressLocality).toBe('Indaial');
  expect(data.address.addressRegion).toBe('SC');
});

test('no third-party request besides Turnstile on any page', async ({ page }) => {
  const external = new Set<string>();
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.hostname !== '127.0.0.1' && u.protocol.startsWith('http')) external.add(u.hostname);
  });
  for (const { path } of ALL_ROUTES) {
    await page.goto(path, { waitUntil: 'networkidle' });
  }
  const unexpected = [...external].filter((h) => h !== 'challenges.cloudflare.com');
  expect(unexpected).toEqual([]);
  expect(await page.context().cookies()).toEqual([]);
});
