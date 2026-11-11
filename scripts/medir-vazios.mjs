// Item 25a/b (feedback 11/11): for every page at 1440×900 and 390×844, the tallest empty band
// between pieces of content in <main> and the sections whose content leaves the right half empty.
// Usage: node scripts/medir-vazios.mjs [baseUrl]
import { chromium } from '@playwright/test';

const BASE = process.argv[2] ?? 'http://127.0.0.1:8795';
const PAGES = [
  '/',
  '/recognition',
  '/como-funciona',
  '/demos',
  '/plataforma',
  '/integradores',
  '/twins',
  '/robotica',
  '/conformidade',
  '/sobre',
  '/contato',
  '/privacidade',
  '/en/',
  '/en/recognition',
  '/en/about',
];
const browser = await chromium.launch();
let worst = 0;
for (const [label, viewport] of [
  ['1440', { width: 1440, height: 900 }],
  ['390', { width: 390, height: 844 }],
]) {
  const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => sessionStorage.setItem('lk-abertura', '1'));
  const page = await ctx.newPage();
  for (const path of PAGES) {
    await page.goto(BASE + path);
    const r = await page.evaluate(() => {
      const main = document.querySelector('main');
      if (!main) return { gap: 0, half: [] };
      const leaves = [
        ...main.querySelectorAll('h1,h2,h3,p,li,dt,dd,img,video,svg,button,a.btn,input,table,figure,form,.cam,.folha,.sinal'),
      ];
      const boxes = leaves
        .map((e) => e.getBoundingClientRect())
        .filter((b) => b.width > 2 && b.height > 2)
        .map((b) => [b.top + scrollY, b.bottom + scrollY]);
      boxes.sort((a, b) => a[0] - b[0]);
      let gap = 0;
      let end = boxes[0]?.[1] ?? 0;
      for (const [top, bottom] of boxes) {
        if (top > end) gap = Math.max(gap, top - end);
        end = Math.max(end, bottom);
      }
      const half = [];
      if (innerWidth >= 1024)
        for (const s of main.querySelectorAll(':scope > section, :scope > div > section')) {
          const c = s.querySelector('.container, .wrap') ?? s;
          const cb = c.getBoundingClientRect();
          const inner = [...s.querySelectorAll('h2,h3,p,li,img,video,svg,form,table,.folha,.cam')]
            .map((e) => e.getBoundingClientRect())
            .filter((b) => b.width > 2);
          const right = Math.max(...inner.map((b) => b.right));
          if (inner.length && right < cb.left + cb.width * 0.62) half.push(s.getAttribute('aria-labelledby') ?? s.className);
        }
      return { gap: Math.round(gap), half };
    });
    worst = Math.max(worst, r.gap / viewport.height);
    console.log(
      `${label.padEnd(5)} ${path.padEnd(18)} maior vazio ${String(r.gap).padStart(4)} px (${((r.gap / viewport.height) * 100).toFixed(0)} % da tela)${r.half.length ? ` · metade vazia: ${r.half.join(', ')}` : ''}`,
    );
  }
  await ctx.close();
}
await browser.close();
console.log(`pior faixa vazia: ${(worst * 100).toFixed(0)} % de uma tela`);
