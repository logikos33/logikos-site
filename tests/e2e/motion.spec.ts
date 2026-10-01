import { expect, test } from '@playwright/test';
import { stubTurnstile } from './helpers.ts';

// Deterministic: Turnstile's real widget is exercised only by the form tests.
test.beforeEach(async ({ page }) => stubTurnstile(page));

test('glitch runs once on a fresh home load and ends clean', async ({ page }, info) => {
  await page.goto('/');
  const mark = page.locator('[data-brand-box] .lk-glitch');
  await expect(mark).toHaveAttribute('data-glitch', /run|done/);
  // Mid-animation evidence (the effect is 0.5 s).
  await page.waitForTimeout(120);
  await info.attach('glitch-mid.png', { body: await page.locator('[data-brand-box]').screenshot(), contentType: 'image/png' });
  await expect(mark).toHaveAttribute('data-glitch', 'done', { timeout: 3000 });
  await expect(mark).not.toHaveClass(/is-glitching/);
  const animations = await mark.evaluate((el) => el.getAnimations({ subtree: true }).length);
  expect(animations).toBe(0);
  await info.attach('glitch-rest.png', { body: await page.locator('[data-brand-box]').screenshot(), contentType: 'image/png' });
});

test('glitch never runs under prefers-reduced-motion', async ({ browser }, info) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/');
  const mark = page.locator('[data-brand-box] .lk-glitch');
  await expect(mark).toHaveAttribute('data-glitch', 'off-reduced-motion');
  await expect(mark).not.toHaveClass(/is-glitching/);
  const animations = await mark.evaluate((el) => el.getAnimations({ subtree: true }).length);
  expect(animations).toBe(0);
  await info.attach('glitch-reduced-motion.png', { body: await page.locator('[data-brand-box]').screenshot(), contentType: 'image/png' });
  await ctx.close();
});

test('glitch does not repeat on internal navigation back to home', async ({ page }) => {
  await page.goto('/sobre');
  await page.locator('.site-header__logo').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('[data-brand-box] .lk-glitch')).toHaveAttribute('data-glitch', 'off-internal-navigation');
});

test('no continuous animation anywhere on the home page after it settles', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(8000);
  const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
  expect(running).toBe(0);
});

test('HUD draws detection boxes in steps and rests on the last frame', async ({ page }) => {
  await page.goto('/');
  const hud = page.locator('[data-hud][data-slot="hero"]');
  await expect(hud).toHaveAttribute('data-state', 'playing');
  await expect(hud.locator('.hud-box').first()).toBeVisible();
  await expect(hud).toHaveAttribute('data-state', 'ended', { timeout: 15_000 });
  await expect(hud.locator('[data-hud-play]')).toBeVisible();
  await expect(hud.locator('.hud-box--alert')).not.toHaveCount(0);
  // State is never color alone: every state chip carries an icon and a word.
  const chips = hud.locator('.hud-chip--ok, .hud-chip--alert, .hud-chip--warn');
  for (const chip of await chips.all()) {
    await expect(chip.locator('.hud-chip__icon')).toHaveCount(1);
    await expect(chip.locator('.hud-chip__text')).not.toHaveText('');
  }
  await expect(hud.locator('[data-hud-badge]')).toBeVisible();
});

test('reduced motion: HUD waits for play, then plays once', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/');
  const hud = page.locator('[data-hud][data-slot="hero"]');
  await expect(hud).toHaveAttribute('data-state', 'idle');
  await expect(hud.locator('.hud-box')).toHaveCount(0);
  await hud.locator('[data-hud-play]').click();
  await expect(hud).toHaveAttribute('data-state', 'ended', { timeout: 15_000 });
  await expect(hud.locator('.hud-box').first()).toBeVisible();
  await ctx.close();
});
