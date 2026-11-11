import { expect, test } from '@playwright/test';
import { stubTurnstile } from './helpers.ts';

// Deterministic: Turnstile's real widget is exercised only by the form tests.
test.beforeEach(async ({ page }) => stubTurnstile(page));

const isVideo = (url: string) => /\.mp4(\?|$)/.test(url);

test('home opening: once per session, skippable, the rest of the page inert meanwhile', async ({ page }) => {
  await page.goto('/');
  const opening = page.locator('[data-abertura]');
  await expect(opening).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/lk-abre/);
  // Focus is on Skip; header and main cannot be reached while it plays.
  await expect(page.locator('[data-pular]')).toBeFocused();
  expect(await page.locator('main').evaluate((el) => (el as HTMLElement).inert)).toBe(true);
  await page.locator('[data-pular]').click();
  await expect(opening).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveClass(/lk-abre/);
  expect(await page.locator('main').evaluate((el) => (el as HTMLElement).inert)).toBe(false);
  await expect(page.locator('.site-header__logo')).toBeFocused();
  // Same session: no second opening.
  await page.goto('about:blank');
  await page.goto('/');
  await expect(page.locator('[data-abertura]')).toHaveCount(0);
  await expect(page.locator('h1')).toBeVisible();
});

test('home opening: plays to the end, dives in and ends at rest (fail-safe if the video stalls)', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-abertura]')).toBeVisible();
  // Either the clip ended and the dive ran, or it never started and the 1.2 s fail-safe opened the site.
  await expect(page.locator('[data-abertura]')).toHaveCount(0, { timeout: 12_000 });
  await expect(page.locator('html')).not.toHaveClass(/lk-abre|lk-entrando/);
  await expect(page.locator('h1')).toBeVisible();
});

test('home under reduced motion: no opening, posters only, no video downloaded, nothing moves', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const videos: string[] = [];
  page.on('request', (r) => isVideo(r.url()) && videos.push(r.url()));
  await page.goto('/');
  await expect(page.locator('[data-abertura]')).toHaveCount(0);
  await page.locator('#cenarios').scrollIntoViewIfNeeded();
  await page.locator('#prova').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  expect(videos).toEqual([]);
  const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
  expect(running).toBe(0);
  // The partner strip shows each logo once, still.
  await expect(page.locator('.marquee li:not([data-copia])')).toHaveCount(3);
  await expect(page.locator('.marquee [data-copia]').first()).toBeHidden();
  await ctx.close();
});

test('home idle: wall videos load only after the opening and near the screen; the Stop control halts every loop', async ({ page }) => {
  const videos: string[] = [];
  page.on('request', (r) => isVideo(r.url()) && videos.push(new URL(r.url()).pathname));
  await page.goto('/?sem-abertura');
  const wall = page.locator('.muro video');
  // The wall clips get their source once visible; nothing below the fold (Fireshow) is requested.
  await expect.poll(() => wall.evaluateAll((vs) => vs.filter((v) => v.getAttribute('src')).length)).toBe(5);
  expect(videos.some((v) => v.includes('/fs-'))).toBe(false);
  await expect(page.locator('.prova video').first()).not.toHaveAttribute('src', /.+/);
  // Bundled Chromium has no H.264; where the codec exists the loop really plays and pauses.
  const h264 = await page.evaluate(() => document.createElement('video').canPlayType('video/mp4; codecs="avc1.4D401E"') !== '');
  const playing = () => wall.first().evaluate((v: HTMLVideoElement) => !v.paused);
  if (h264) await expect.poll(playing).toBe(true);
  // WCAG 2.2.2: one control stops videos, the partner strip, the diagram pulse and the channels.
  // It stays off the picture until the keyboard reaches it.
  const stop = page.locator('[data-parar]');
  expect((await stop.boundingBox())?.width ?? 0).toBeLessThanOrEqual(1);
  await stop.focus();
  await expect(stop).toBeVisible();
  expect((await stop.boundingBox())?.width ?? 0).toBeGreaterThan(40);
  await stop.press('Enter');
  await expect(stop).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveClass(/lk-parado/);
  expect(await wall.evaluateAll((vs) => vs.every((v) => (v as HTMLVideoElement).paused))).toBe(true);
  const running = await page.evaluate(
    () =>
      document.getAnimations().filter((a) => a.playState === 'running' && !(a as CSSAnimation).animationName?.startsWith('liga')).length,
  );
  expect(running).toBe(0);
  await stop.press('Enter');
  await expect(stop).toHaveAttribute('aria-pressed', 'false');
  if (h264) {
    await expect.poll(playing).toBe(true);
    // Off-screen videos pause.
    await page.locator('footer').scrollIntoViewIfNeeded();
    await expect.poll(() => wall.first().evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  }
});

test('HUD draws detection boxes in steps and rests on the last frame', async ({ page }) => {
  await page.goto('/recognition');
  const hud = page.locator('[data-hud]#rec-stage');
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
  await page.goto('/recognition');
  const hud = page.locator('[data-hud]#rec-stage');
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
  await page.goto('/recognition');
  const hud = page.locator('[data-hud]#rec-stage');
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

test('glitch slices never cross the two O letters (keyhole), at desktop and phone widths (/_marca)', async ({ browser }) => {
  for (const width of [1440, 360]) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/_marca');
    const { problems: overlaps, checked } = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>('[data-brand-box] .lk-glitch');
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

test('M4: the pipeline is revealed in order, once, and ends at rest; static when reduced motion', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto('/como-funciona');
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
  await p2.goto('/como-funciona');
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
