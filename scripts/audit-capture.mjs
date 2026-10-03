import { chromium, devices } from '@playwright/test';
import { writeFileSync } from 'node:fs';
const OUT = process.argv[2],
  BASE = process.argv[3] ?? 'https://logikos-site.pages.dev';
// WIDTHS=360,768 PAGES=home,404 narrow the run (defaults: 390 + 1440, every page below).
const WIDTHS = (process.env.WIDTHS ?? '390,1440').split(',').map(Number);
const ONLY = process.env.PAGES?.split(',');
const ALL_PAGES = {
  home: '/',
  recognition: '/recognition',
  'como-funciona': '/como-funciona',
  demos: '/demos',
  plataforma: '/plataforma',
  integradores: '/integradores',
  404: '/nao-existe',
  'en-home': '/en/',
  'en-recognition': '/en/recognition',
  'en-demos': '/en/demos',
};
const PAGES = Object.fromEntries(Object.entries(ALL_PAGES).filter(([k]) => !ONLY || ONLY.includes(k)));
const VIEWPORTS = {
  360: [360, 780, devices['Pixel 7']],
  390: [390, 844, devices['Pixel 7']],
  768: [768, 1024, devices['iPad Mini']],
  1440: [1440, 900, {}],
};
const browser = await chromium.launch();
const metrics = {};
for (const theme of ['light', 'dark'])
  for (const [w, h, dev] of WIDTHS.map((x) => VIEWPORTS[x])) {
    const ctx = await browser.newContext({ ...dev, viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    await ctx.addInitScript((t) => {
      try {
        localStorage.setItem('lk-theme', t);
      } catch {
        // storage blocked: the page falls back to the light theme
      }
    }, theme);
    for (const [name, path] of Object.entries(PAGES)) {
      const page = await ctx.newPage();
      const bytes = { total: 0, font: 0, css: 0, js: 0, html: 0, img: 0, media: 0 };
      page.on('response', async (r) => {
        try {
          const b = await r.body();
          const t = r.request().resourceType();
          bytes.total += b.length;
          if (t === 'font') bytes.font += b.length;
          else if (t === 'stylesheet') bytes.css += b.length;
          else if (t === 'script') bytes.js += b.length;
          else if (t === 'document') bytes.html += b.length;
          else if (t === 'image') bytes.img += b.length;
          else if (t === 'media') bytes.media += b.length;
        } catch {
          // body unavailable (redirect, aborted): size unknown
        }
      });
      await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
      await page.waitForTimeout(1800);
      await page.screenshot({ path: `${OUT}/${name}-${w}-${theme}.jpg`, type: 'jpeg', quality: 72, fullPage: true });
      if (theme === 'light') {
        await page.screenshot({ path: `${OUT}/${name}-${w}-${theme}-fold.jpg`, type: 'jpeg', quality: 72, fullPage: false });
        const m = await page.evaluate(() => {
          const vh = innerHeight;
          const inFold = (el) => {
            const r = el.getBoundingClientRect();
            return r.top < vh && r.bottom > 0;
          };
          const huds = [...document.querySelectorAll('[data-hud]')].map((f) => {
            const r = f.getBoundingClientRect();
            const stage = f.querySelector('.hud__stage').getBoundingClientRect();
            // Hidden poster chips (display: none once the script owns the figure) report a 0×0 rect at
            // the origin; without the width filter they would count as "left of the stage".
            const chips = [...f.querySelectorAll('.hud__overlay .hud-chip, .hud-pbox rect')]
              .map((c) => c.getBoundingClientRect())
              .filter((c) => c.width > 0);
            return {
              slot: f.dataset.slot,
              state: f.dataset.state ?? null,
              topPx: Math.round(r.top + scrollY),
              inFold: inFold(f),
              overflow: chips.filter((c) => c.right > stage.right + 1 || c.left < stage.left - 1).length,
            };
          });
          const upper = [...document.querySelectorAll('p, span, dt, h3, a')]
            .filter((e) => {
              const cs = getComputedStyle(e);
              return (
                cs.textTransform === 'uppercase' &&
                cs.letterSpacing !== 'normal' &&
                parseFloat(cs.letterSpacing) > 0 &&
                (e.textContent || '').trim().length > 3 &&
                e.offsetParent
              );
            })
            .map((e) => (e.textContent || '').trim().slice(0, 40));
          const h1 = document.querySelector('h1')?.innerText?.trim();
          const firstHudTop = huds[0]?.topPx ?? null;
          return {
            dom: document.getElementsByTagName('*').length,
            img: document.images.length,
            video: document.querySelectorAll('video').length,
            h1,
            huds,
            uppercaseTracked: [...new Set(upper)],
            firstHudTop,
          };
        });
        metrics[`${name}-${w}`] = { ...m, kb: Object.fromEntries(Object.entries(bytes).map(([k, v]) => [k, Math.round(v / 1024)])) };
      }
      await page.close();
    }
    await ctx.close();
  }
writeFileSync(`${OUT}/metrics.json`, JSON.stringify(metrics, null, 1));
await browser.close();
console.log('captured', Object.keys(metrics).length);
