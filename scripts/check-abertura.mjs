// Item 8 (feedback 11/11): the opening must play whole on a first visit, whatever the network.
// Fresh context (empty cache) × desktop 1440 / phone 390 × network profile; reports how far the
// clip got before the overlay left. Usage: node scripts/check-abertura.mjs [baseUrl]
import { chromium } from '@playwright/test';

const BASE = process.argv[2] ?? 'http://127.0.0.1:8795';
const NETS = {
  rapida: null,
  '4g': { latency: 40, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (3 * 1024 * 1024) / 8 },
  lenta: { latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 },
};
const SIZES = {
  desktop: { viewport: { width: 1440, height: 900 } },
  celular: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
};
const browser = await chromium.launch();
let bad = 0;
for (const [size, opts] of Object.entries(SIZES)) {
  for (const [net, cond] of Object.entries(NETS)) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    if (cond) {
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', { offline: false, ...cond });
    }
    await page.addInitScript(() => {
      const w = window;
      w.__ab = { max: 0, dur: 0, ended: false, gone: 0, at: -1 };
      const t0 = performance.now();
      const tick = () => {
        const v = document.querySelector('[data-abertura] video');
        if (v) {
          w.__ab.max = Math.max(w.__ab.max, v.currentTime);
          w.__ab.dur = v.duration || w.__ab.dur;
          // The moment the opening hands over (dive or skip) is what the visitor saw of the clip.
          if (w.__ab.at < 0 && v.closest('.mergulha')) w.__ab.at = v.currentTime;
          if (!v.__l) {
            v.__l = 1;
            v.addEventListener('ended', () => (w.__ab.ended = true));
          }
        } else if (document.readyState !== 'loading' && !w.__ab.gone) {
          w.__ab.gone = Math.round(performance.now() - t0);
          if (w.__ab.at < 0) w.__ab.at = w.__ab.max;
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.goto(BASE + '/', { waitUntil: 'commit' });
    await page.waitForFunction(() => window.__ab.gone > 0, null, { timeout: 30_000 });
    const r = await page.evaluate(() => window.__ab);
    const whole = r.dur > 0 && r.at >= r.dur - 0.15;
    if (!whole) bad++;
    console.log(
      `${size.padEnd(8)} ${net.padEnd(7)} tocou ${r.at.toFixed(2)}/${(r.dur || 0).toFixed(2)} s · ended=${r.ended} · saiu em ${r.gone} ms · ${whole ? 'INTEIRA' : 'CORTADA'}`,
    );
    await ctx.close();
  }
}
await browser.close();
process.exit(bad ? 1 : 0);
