import { expect, test } from '@playwright/test';
import { stubTurnstile } from './helpers.ts';

test.beforeEach(async ({ page }) => stubTurnstile(page));

test('/api/status answers from the server with one state per demo and a 60 s cache header', async ({ request }) => {
  const res = await request.get('/api/status');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('application/json');
  expect(res.headers()['cache-control']).toContain('max-age=60');
  const body = (await res.json()) as { epi: string; fire: string; checked_at: string };
  expect(['up', 'down']).toContain(body.epi);
  expect(['up', 'down']).toContain(body.fire);
  expect(body.checked_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  expect((await request.post('/api/status')).status()).toBe(405);
});

test('M7: the demo chips flip once, in place, to the server state; the link never disappears', async ({ page }) => {
  await page.route('**/api/status', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ epi: 'up', fire: 'down', checked_at: '2026-10-03T12:00:00Z' }),
    }),
  );
  await page.goto('/demos');
  const epi = page.locator('[data-demo-status="epi"]').first();
  const fire = page.locator('[data-demo-status="fire"]').first();
  await expect(epi).toHaveAttribute('data-state', 'up');
  await expect(epi).toHaveText(/no ar|live/);
  await expect(fire).toHaveAttribute('data-state', 'down');
  await expect(fire).toHaveText(/fora do ar agora|down right now/);
  await expect(fire).toHaveText(/instantes|shortly/);
  // Down keeps its link; no mock stage stands in for the real demo any more (AUDITORIA-V2 F-14).
  const fireBlock = page.locator('[data-demo="fire"]').first();
  await expect(fireBlock.locator('a')).toHaveAttribute('href', /fire-demo-production/);
  await expect(page.locator('[data-hud]')).toHaveCount(0);
  // Nothing keeps moving once the state landed.
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0);
});

test('M7: when the status request fails the chip stays "checking" (never a fake "live")', async ({ page }) => {
  await page.route('**/api/status', (route) => route.fulfill({ status: 500, body: 'x' }));
  await page.goto('/');
  const chip = page.locator('[data-demo-status="epi"]').first();
  await page.waitForTimeout(500);
  await expect(chip).not.toHaveAttribute('data-state', /.+/);
  await expect(chip).toHaveText(/verificando|checking/);
});
