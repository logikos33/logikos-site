// Keyboard walk on production: tab order (first 25 stops), focus-visible ring, Escape on the mobile menu, Enter/Space on chips.
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
const OUT = process.argv[2],
  BASE = process.argv[3] ?? 'https://logikos-site.pages.dev';
const PAGES = ['/', '/recognition', '/como-funciona', '/demos', '/plataforma', '/integradores', '/nao-existe'];
const browser = await chromium.launch();
const report = {};
for (const path of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  const stops = [];
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    const s = await page.evaluate(() => {
      const e = document.activeElement;
      if (!e || e === document.body) return null;
      const cs = getComputedStyle(e);
      const r = e.getBoundingClientRect();
      return {
        tag: e.tagName.toLowerCase(),
        text: (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40),
        outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0,
        w: Math.round(r.width),
        h: Math.round(r.height),
        visible: r.width > 0 && r.height > 0,
      };
    });
    if (s) stops.push(s);
  }
  const smallTargets = stops
    .filter((s) =>
      s.visible && (s.w < 44 || s.h < 44) && s.tag !== 'a' ? true : s.visible && s.tag === 'button' && (s.w < 44 || s.h < 44),
    )
    .map((s) => `${s.tag}:${s.text}:${s.w}x${s.h}`);
  const noRing = stops.filter((s) => s.visible && !s.outline).map((s) => `${s.tag}:${s.text}`);
  // mobile menu Escape
  const m = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await m.newPage();
  await mp.goto(`${BASE}${path}`, { waitUntil: 'load' });
  await mp.locator('.mobile-nav summary').click();
  const opened = await mp.locator('.mobile-nav').evaluate((d) => d.open);
  await mp.keyboard.press('Escape');
  const closed = !(await mp.locator('.mobile-nav').evaluate((d) => d.open));
  const summaryFocused = await mp.evaluate(() => document.activeElement?.tagName.toLowerCase() === 'summary');
  // readings: arrow keys
  let readings = null;
  if (await page.locator('[data-hud-readings] input').count()) {
    await page.locator('[data-hud-readings] input').first().focus();
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(400);
    readings = await page.locator('[data-hud-readings] input:checked').evaluate((i) => i.value);
  }
  let playBtn = null;
  if (await page.locator('[data-hud-play]').count()) {
    const b = page.locator('[data-hud-play]').first();
    await b.scrollIntoViewIfNeeded();
    await b.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    playBtn = await page.locator('[data-hud]').first().getAttribute('data-state');
  }
  report[path] = {
    stops: stops.map((s) => `${s.tag}:${s.text}${s.outline ? '' : ' (sem anel)'}`),
    noRing,
    smallTargets,
    mobileMenu: { opened, closedOnEscape: closed, focusBackOnSummary: summaryFocused },
    readingsArrowKeys: readings,
    playEnter: playBtn,
  };
  await m.close();
  await ctx.close();
}
writeFileSync(`${OUT}/keyboard-prod.json`, JSON.stringify(report, null, 1));
await browser.close();
for (const [p, r] of Object.entries(report))
  console.log(
    p,
    'noRing',
    r.noRing.length,
    'small',
    r.smallTargets.length,
    'menu',
    JSON.stringify(r.mobileMenu),
    'readings',
    r.readingsArrowKeys,
    'play',
    r.playEnter,
  );
