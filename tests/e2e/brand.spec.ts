// Brand regression: the official lockup (L on the Λ angle, O-keyhole) is on every page, as
// vectors — a text "LOGIKOS" in the header, footer, 404 or OG is a failure (AUDITORIA-V2 F-01).
import { expect, test } from '@playwright/test';
import { ALL_ROUTES, stubTurnstile } from './helpers.ts';

test.beforeEach(async ({ page }) => stubTurnstile(page));

test('every route shows the vector wordmark in the header and the symbol in the footer, never text', async ({ page }) => {
  for (const { path } of [...ALL_ROUTES, { path: '/nao-existe' }]) {
    await page.goto(path);
    const header = page.locator('.site-header__logo');
    // The home header carries the glitch: one mark plus two slice copies.
    const copies = path === '/' || path === '/en/' ? 3 : 1;
    await expect(header.locator('svg[data-brand="wordmark"] [data-glyph="L"]'), path).toHaveCount(copies);
    await expect(header.locator('svg[data-brand="wordmark"] [data-glyph="O"]'), path).toHaveCount(copies);
    expect((await header.innerText()).toUpperCase(), `${path}: header text`).not.toContain('LOGIKOS');
    await expect(page.locator('.site-footer svg[data-brand="symbol"]'), path).toHaveCount(1);
    expect(await page.locator('.lk-wordmark').count(), `${path}: legacy text wordmark`).toBe(0);
  }
});

test('the wordmark is black on light and white on dark (currentColor), at its 90 px minimum', async ({ page }) => {
  await page.goto('/');
  const mark = page.locator('.site-header__logo svg[data-brand="wordmark"]').first();
  expect((await mark.boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(90);
  const light = await mark.evaluate((el) => getComputedStyle(el).color);
  await page.locator('[data-theme-toggle]').click();
  const dark = await mark.evaluate((el) => getComputedStyle(el).color);
  expect(light).toBe('rgb(10, 10, 15)');
  expect(dark).toBe('rgb(244, 246, 248)');
});

test('favicon and OG card are built from the official symbol and lockup', async ({ request }) => {
  const svg = await (await request.get('/favicon.svg')).text();
  expect(svg).toContain('A63.50 63.50'); // the keyhole arc
  expect(svg).not.toContain('polyline'); // not the old Λ monogram
  const og = await request.get('/og/pt-br/home.png');
  expect(og.ok()).toBe(true);
  expect((await og.body()).length).toBeGreaterThan(10_000);
});

test('the 404 page shows the lockup once, as vectors, above its own heading', async ({ page }) => {
  await page.goto('/nao-existe');
  await expect(page.locator('main svg[data-brand="wordmark"]')).toHaveCount(1);
  await expect(page.locator('main [data-brand-box]')).toHaveCount(0);
});
