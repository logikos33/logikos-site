import { expect, test } from '@playwright/test';
import { stubTurnstile } from './helpers.ts';

// Deterministic: Turnstile's real widget is exercised only by the form tests.
test.beforeEach(async ({ page }) => stubTurnstile(page));

test('glitch runs once on a fresh home load and ends clean', async ({ page }, info) => {
  await page.goto('/');
  const mark = page.locator('.lk-glitch--armed');
  await expect(mark).toHaveAttribute('data-glitch', /run|done/);
  // Mid-animation evidence (the effect is 0.5 s).
  await page.waitForTimeout(120);
  await info.attach('glitch-mid.png', { body: await page.locator('.site-header__logo').screenshot(), contentType: 'image/png' });
  await expect(mark).toHaveAttribute('data-glitch', 'done', { timeout: 3000 });
  await expect(mark).not.toHaveClass(/is-glitching/);
  const animations = await mark.evaluate((el) => el.getAnimations({ subtree: true }).length);
  expect(animations).toBe(0);
  await info.attach('glitch-rest.png', { body: await page.locator('.site-header__logo').screenshot(), contentType: 'image/png' });
});

test('glitch never runs under prefers-reduced-motion', async ({ browser }, info) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/');
  const mark = page.locator('.lk-glitch--armed');
  await expect(mark).toHaveAttribute('data-glitch', 'off-reduced-motion');
  await expect(mark).not.toHaveClass(/is-glitching/);
  const animations = await mark.evaluate((el) => el.getAnimations({ subtree: true }).length);
  expect(animations).toBe(0);
  await info.attach('glitch-reduced-motion.png', { body: await page.locator('.site-header__logo').screenshot(), contentType: 'image/png' });
  await ctx.close();
});

test('glitch does not repeat on internal navigation back to home', async ({ page }) => {
  await page.goto('/sobre');
  await page.locator('.site-header__logo').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.lk-glitch--armed')).toHaveAttribute('data-glitch', 'off-internal-navigation');
});

test('glitch does not repeat on Back navigation to home', async ({ page }) => {
  await page.goto('/', { referer: 'https://www.google.com/' });
  await expect(page.locator('.lk-glitch--armed')).toHaveAttribute('data-glitch', 'done', { timeout: 5000 });
  await page.locator('.site-nav a[href="/sobre"]').click();
  await expect(page).toHaveURL(/\/sobre$/);
  await page.goBack();
  const state = await page.locator('.lk-glitch--armed').getAttribute('data-glitch');
  // Restored from bfcache (no script re-run) keeps "done"; a fresh load must skip (same session or internal).
  expect(['done', 'off-session', 'off-internal-navigation']).toContain(state);
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
  // WCAG 2.2.2: while it moves, a visible Stop control exists.
  await expect(hud.locator('[data-hud-play]')).toBeVisible();
  await expect(hud.locator('[data-hud-play]')).toHaveAttribute('data-mode', 'stop');
  await expect(hud).toHaveAttribute('data-state', 'ended', { timeout: 15_000 });
  await expect(hud.locator('[data-hud-play]')).toHaveAttribute('data-mode', 'replay');
  await expect(hud.locator('.hud-box--alert')).not.toHaveCount(0);
  // State is never color alone: every state chip carries an icon and a word.
  const chips = hud.locator('.hud-chip--ok, .hud-chip--alert, .hud-chip--warn');
  for (const chip of await chips.all()) {
    await expect(chip.locator('.hud-chip__icon')).toHaveCount(1);
    await expect(chip.locator('.hud-chip__text')).not.toHaveText('');
  }
  await expect(hud.locator('[data-hud-badge]')).toBeVisible();
});

test('Stop ends playback at rest and keeps keyboard focus on the control', async ({ page }) => {
  await page.goto('/');
  const hud = page.locator('[data-hud][data-slot="hero"]');
  const control = hud.locator('[data-hud-play]');
  await expect(hud).toHaveAttribute('data-state', 'playing');
  await control.focus();
  await page.keyboard.press('Enter');
  await expect(hud).toHaveAttribute('data-state', 'ended');
  await expect(control).toBeFocused();
  await expect(control).toHaveAttribute('data-mode', 'replay');
  await page.keyboard.press('Enter');
  await expect(hud).toHaveAttribute('data-state', 'playing');
  await expect(control).toBeFocused();
});

test('reduced motion: HUD waits for play, then plays once', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/');
  const hud = page.locator('[data-hud][data-slot="hero"]');
  await expect(hud).toHaveAttribute('data-state', 'idle');
  // At rest the verdict is already there (last frame), nothing moves until the user plays.
  const atRest = await hud.locator('.hud__overlay .hud-box').count();
  expect(atRest).toBeGreaterThan(0);
  await page.waitForTimeout(1200);
  await expect(hud).toHaveAttribute('data-state', 'idle');
  expect(await hud.locator('.hud__overlay .hud-box').count()).toBe(atRest);
  await hud.locator('[data-hud-play]').click();
  await expect(hud).toHaveAttribute('data-state', 'playing');
  await expect(hud).toHaveAttribute('data-state', 'ended', { timeout: 15_000 });
  await expect(hud.locator('.hud-box').first()).toBeVisible();
  await ctx.close();
});

test('glitch slices never cross the two O letters (keyhole), at desktop and phone widths', async ({ browser }) => {
  for (const width of [1440, 360]) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/');
    const { problems: overlaps, checked } = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>('.lk-glitch--armed');
      const mark = el?.querySelector<SVGSVGElement>('svg[data-brand="wordmark"]');
      if (!el || !mark) return { problems: ['wordmark not found'], checked: 0 };
      const box = mark.getBoundingClientRect();
      // Both O letters: the keyhole (data-glyph="O") and the plain one (data-glyph="O2").
      const oRanges: [number, number][] = [...mark.querySelectorAll<SVGGraphicsElement>('[data-glyph^="O"]')].map((g) => {
        const r = g.getBoundingClientRect();
        return [r.left - box.left, r.right - box.left];
      });
      if (oRanges.length !== 2) return { problems: [`expected two O glyphs, found ${oRanges.length}`], checked: 0 };
      const problems: string[] = [];
      let checked = 0;
      for (const sheet of [...document.styleSheets]) {
        let rules: CSSRuleList;
        try {
          rules = sheet.cssRules;
        } catch {
          continue;
        }
        for (const rule of [...rules]) {
          if (!(rule instanceof CSSKeyframesRule) || !rule.name.includes('lk-glitch')) continue;
          for (const frame of [...rule.cssRules] as CSSKeyframeRule[]) {
            const inset = /inset\(([^)]+)\)/.exec(frame.style.clipPath)?.[1]?.split(/\s+/).map(parseFloat);
            if (!inset || inset.length < 4) continue;
            const [top, right, bottom, left] = inset as [number, number, number, number];
            if (top + bottom >= 100 || left + right >= 100) continue; // empty slice (rest state)
            checked++;
            const tx = parseFloat(/translateX\((-?[\d.]+)px\)/.exec(frame.style.transform)?.[1] ?? '0');
            const x0 = (box.width * left) / 100 + tx;
            const x1 = box.width * (1 - right / 100) + tx;
            // Content shown inside the slice comes from [x0 - tx, x1 - tx] of the original text.
            for (const [o0, o1] of oRanges) {
              const hitsClip = x0 < o1 && x1 > o0;
              const hitsSource = x0 - tx < o1 && x1 - tx > o0;
              if (hitsClip || hitsSource)
                problems.push(
                  `${rule.name} ${frame.keyText}: slice ${x0.toFixed(1)}–${x1.toFixed(1)} vs O ${o0.toFixed(1)}–${o1.toFixed(1)}`,
                );
            }
          }
        }
      }
      return { problems, checked };
    });
    expect(checked, 'glitch keyframes found').toBeGreaterThanOrEqual(5);
    expect(overlaps, `width ${width}`).toEqual([]);
    await ctx.close();
  }
});

test('M1: the glitch runs once per session and hands over to the hero HUD', async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('/');
  const mark = page.locator('.lk-glitch--armed');
  await expect(mark).toHaveAttribute('data-glitch', 'done', { timeout: 5000 });
  const hud = page.locator('[data-hud][data-slot="hero"]');
  await expect(hud).toHaveAttribute('data-state', /playing|ended/, { timeout: 5000 });
  // Same session, fresh external load: no second glitch, the HUD still starts.
  await page.goto('about:blank');
  await page.goto('/');
  await expect(mark).toHaveAttribute('data-glitch', 'off-session');
  await expect(mark).not.toHaveClass(/is-glitching/);
  await expect(page.locator('[data-hud][data-slot="hero"]')).toHaveAttribute('data-state', /playing|ended/, { timeout: 5000 });
  await ctx.close();
});

test('M4: the pipeline is revealed in order, once, and ends at rest; static when reduced motion', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto('/');
  const pipe = page.locator('[data-pipeline]').first();
  await expect(pipe).toHaveClass(/pipeline--armed/);
  await pipe.scrollIntoViewIfNeeded();
  await expect(pipe).toHaveClass(/is-seen/);
  const nodes = pipe.locator('.pipeline__node');
  await expect(nodes).toHaveCount(4);
  for (let i = 0; i < 4; i++) await expect(nodes.nth(i)).toBeVisible({ timeout: 3000 });
  await page.waitForTimeout(1500);
  const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
  expect(running).toBe(0);
  await ctx.close();

  const reduced = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } });
  const p2 = await reduced.newPage();
  await p2.goto('/');
  await expect(p2.locator('[data-pipeline]').first()).not.toHaveClass(/pipeline--armed/);
  await expect(p2.locator('[data-pipeline] .pipeline__node').first()).toBeVisible();
  await reduced.close();
});

test('M3: the pose selector moves a region out of frame and the verdict follows, without JavaScript', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/recognition');
  const avatar = page.locator('[data-avatar]');
  await avatar.scrollIntoViewIfNeeded();
  const hands = avatar.locator('.avatar__row[data-region="hands"] .verdict:visible');
  const feet = avatar.locator('.avatar__row[data-region="feet"] .verdict:visible');
  const head = avatar.locator('.avatar__row[data-region="head"] .verdict:visible');
  await expect(hands).toHaveClass(/verdict--warn/);
  await expect(avatar.locator('.avatar__person:visible')).toHaveText(/nada enviado|nothing sent/);
  await avatar.locator('input[value="crouching"]').check();
  await expect(feet).toHaveClass(/verdict--warn/);
  await expect(head).toHaveClass(/verdict--alert/);
  await expect(avatar.locator('.avatar__person:visible')).toContainText(/alerta enviado|alert sent/);
  await avatar.locator('input[value="half"]').check();
  await expect(head).toHaveClass(/verdict--warn/);
  await expect(avatar.locator('.avatar__person:visible')).toHaveText(/nada enviado|nothing sent/);
  // Every visible chip carries icon + word (never color alone).
  for (const chip of await avatar.locator('.verdict:visible').all()) {
    await expect(chip.locator('svg')).toHaveCount(1);
    await expect(chip).not.toHaveText('');
  }
  await ctx.close();
});
