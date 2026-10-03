import { expect, test } from '@playwright/test';
import { ROUTES } from '../../src/i18n/routes.ts';
import { ALL_ROUTES, stubTurnstile } from './helpers.ts';

test.beforeEach(async ({ page }) => stubTurnstile(page));

test('home has exactly six sections, each with its question for screen readers and in the margin', async ({ page }) => {
  await page.goto('/');
  const sections = page.locator('main > section');
  await expect(sections).toHaveCount(6);
  for (let i = 0; i < 6; i++) {
    const s = sections.nth(i);
    await expect(s.locator('.q')).toHaveCount(1);
    await expect(s.locator('.q')).toHaveText(/\?$|funcionando$/);
    await expect(s.locator('h1, h2').first()).toBeVisible();
  }
});

test('the margin question is visible on desktop and hidden (but readable) on narrow screens', async ({ browser }) => {
  const wide = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const w = await wide.newPage();
  await w.goto('/');
  await expect(w.locator('main > section .q').first()).toBeVisible();
  await wide.close();
  const narrow = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const n = await narrow.newPage();
  await n.goto('/');
  await expect(n.locator('main > section .q').first()).toBeHidden();
  await expect(n.locator('main > section .q-sr').first()).toHaveText(/\?/);
  await narrow.close();
});

test('nav has six items plus sign-in (production login, new tab) and the CTA', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.site-nav a')).toHaveCount(6);
  const login = page.locator('header [data-login]');
  await expect(login).toHaveAttribute('href', /frontend-production-bf96\.up\.railway\.app\/login$/);
  await expect(login).toHaveAttribute('target', '_blank');
  await expect(login).toHaveAttribute('rel', /noopener/);
});

test('no generic tells in the built pages: arrows in links, decorative eyebrows, card grids', async ({ page }) => {
  for (const { path } of ALL_ROUTES) {
    await page.goto(path);
    const arrows = await page.locator('a, button').evaluateAll((els) => els.filter((e) => /→|&rarr;/.test(e.textContent ?? '')).length);
    expect(arrows, `${path}: arrows`).toBe(0);
    const eyebrows = await page.locator('.eyebrow').count();
    // Only the two doors on the home (audience) and the 404 (code) may carry an eyebrow.
    expect(eyebrows, `${path}: eyebrows`).toBeLessThanOrEqual(path === ROUTES.home['pt-br'] || path === ROUTES.home.en ? 2 : 0);
    expect(await page.locator('.card').count(), `${path}: cards`).toBe(0);
    expect(await page.locator('.grid--5, .grid--3').count(), `${path}: grids`).toBe(0);
  }
});

test('the stage swaps reading, clip and caption on the same figure', async ({ page }) => {
  await page.goto('/');
  const stage = page.locator('[data-hud]#stage');
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute('data-slot', 'fire');
  const before = await stage.locator('[data-hud-machine]').textContent();
  await page.locator('[data-hud-readings="stage"] input[value="counting"]').check();
  await expect(stage).toHaveAttribute('data-slot', 'counting');
  await expect(stage.locator('[data-hud-machine]')).not.toHaveText(before ?? '');
  await expect(stage.locator('[data-hud-person-text]')).toHaveText(/nada enviado|nothing sent/);
  await expect(page.locator('[data-alert-card][data-slot="counting"]')).toBeVisible();
  await expect(page.locator('[data-alert-card][data-slot="fire"]')).toBeHidden();
});

test('every HUD figure carries a two-cell caption (machine | person) and the poster already shows the verdict', async ({ page }) => {
  await page.goto('/recognition');
  const figs = page.locator('[data-hud]');
  expect(await figs.count()).toBeGreaterThan(0);
  for (let i = 0; i < (await figs.count()); i++) {
    const f = figs.nth(i);
    await expect(f.locator('[data-hud-machine]')).toHaveText(/CAM \d{2} · \d{2}:\d{2}:\d{2} · /);
    await expect(f.locator('[data-hud-person-text]')).not.toHaveText('');
    const poster = f.locator('img.hud__poster:not([hidden]), video[poster]').first();
    await expect(poster, `figure ${i} has a poster at rest`).toHaveCount(1);
  }
  // The verdict poster (no-JS fallback) carries the last frame's boxes; the plain one does not.
  const verdict = await (await page.request.get('/media/posters/pt-br/fire.svg')).text();
  const plain = await (await page.request.get('/media/posters/pt-br/fire-plain.svg')).text();
  expect(verdict).toContain('hud-pbox');
  expect(plain).not.toContain('hud-pbox');
});
