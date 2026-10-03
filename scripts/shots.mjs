// Before/after screenshots for design PRs: 8 pages × 360/768/1280 × light/dark, full page.
// Usage: node scripts/shots.mjs <outDir> [baseUrl]   (default base: wrangler pages dev on :8788)
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const OUT = process.argv[2] ?? 'docs/design/baseline/antes';
const BASE = process.argv[3] ?? 'http://127.0.0.1:8788';
const PAGES = {
  home: '/',
  'en-home': '/en/',
  recognition: '/recognition',
  'en-recognition': '/en/recognition',
  'como-funciona': '/como-funciona',
  'en-how-it-works': '/en/how-it-works',
  integradores: '/integradores',
  'en-partners': '/en/partners',
};
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
for (const theme of ['light', 'dark']) {
  for (const width of [360, 768, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    await ctx.addInitScript((t) => {
      try {
        localStorage.setItem('lk-theme', t);
      } catch {
        /* storage blocked */
      }
    }, theme);
    const page = await ctx.newPage();
    for (const [name, path] of Object.entries(PAGES)) {
      // 'load' + a short settle: pages with the Turnstile widget never reach network idle.
      await page.goto(`${BASE}${path}`, { waitUntil: 'load', timeout: 30_000 });
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${OUT}/${name}-${width}-${theme}.jpg`, type: 'jpeg', quality: 80, fullPage: true, timeout: 30_000 });
    }
    await ctx.close();
  }
}
await browser.close();
console.log(`wrote ${Object.keys(PAGES).length * 6} screenshots to ${OUT}`);
