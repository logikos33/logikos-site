// Final review (13 points): checks each point on the published preview at 1440 and 390 and saves
// one print per point and width. Usage: node scripts/conferir-revisao.mjs <outDir> [baseUrl]
import { chromium } from '@playwright/test';

const OUT = process.argv[2] ?? 'docs/design/feedback-vitor-11-11/revisao-final/depois';
const B = process.argv[3] ?? 'https://pr-48.logikos-site.pages.dev';
const browser = await chromium.launch();
const rows = [];
for (const [w, viewport, mobile] of [
  ['1440', { width: 1440, height: 900 }, false],
  ['390', { width: 390, height: 844 }, true],
]) {
  const ctx = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile });
  await ctx.addInitScript(() => sessionStorage.setItem('lk-abertura', '1'));
  const page = await ctx.newPage();
  const shot = async (sel, name, wait = 500) => {
    const el = page.locator(sel).first();
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(wait);
    await el.screenshot({ path: `${OUT}/${name}-${w}.jpg`, type: 'jpeg', quality: 72 });
  };
  const text = async (sel = 'main') => page.locator(sel).innerText();
  const row = (n, ok, note) => rows.push({ n, w, ok, note });

  await page.goto(B + '/privacidade');
  await shot('main section', '01-privacidade');
  row(1, !/sede|Indaial/i.test(await text()), 'sem sede/cidade');

  await page.goto(B + '/sobre');
  await shot('.ph', '05-sobre-heroi');
  row(
    5,
    (await page.locator('.ph [data-heroi-acoes] [data-cta="experience"]').count()) === 0,
    'herói só com "Solicite seu modelo customizado"',
  );
  await shot('section[aria-labelledby="why-title"]', '02-sobre-por-que');
  const align = await page.evaluate(() => {
    const s = document.querySelector('section[aria-labelledby="why-title"]');
    const h = s.querySelector('h2').getBoundingClientRect();
    const p = s.querySelector('.lede').getBoundingClientRect();
    return Math.abs(h.top + h.height / 2 - (p.top + p.height / 2));
  });
  row(2, mobile || align < 12, mobile ? 'empilhado no celular' : `centros a ${Math.round(align)} px`);

  await page.goto(B + '/twins');
  await shot('section[aria-labelledby="parts-title"]', '03-twins-peca');
  row(3, /gêmeo digital de cada peça/i.test(await text()), 'seção do gêmeo de cada peça');

  await page.goto(B + '/demos');
  await shot('.ph', '04-demos');
  row(4, /visão computacional/i.test(await page.locator('h1').innerText()), await page.locator('h1').innerText());

  await page.goto(B + '/como-funciona');
  await page
    .screenshot({
      path: `${OUT}/06-11-como-funciona-${w}.jpg`,
      type: 'jpeg',
      quality: 65,
      fullPage: false,
      clip: mobile ? undefined : { x: 0, y: 0, width: 1440, height: 1500 },
    })
    .catch(() => page.screenshot({ path: `${OUT}/06-11-como-funciona-${w}.jpg`, type: 'jpeg', quality: 65 }));
  row(6, !/Só o alerta e o clipe do evento saem da planta/.test(await text()), 'frase removida');
  const gap = await page.evaluate(() => {
    const hero = document.querySelector('.ph').getBoundingClientRect();
    const sec = document.querySelector('section[aria-labelledby="pipeline-title"] h2').getBoundingClientRect();
    return Math.round(sec.top - hero.bottom);
  });
  row(11, gap < 60, `título a ${gap} px do herói`);

  await page.goto(B + '/');
  await shot('.problema', '07-home-planta-tem-cameras');
  row(7, (await page.locator('.problema .folha').count()) === 1, 'texto na folha clara, centralizado');
  await shot('.heroi', '10-home-heroi');
  const exp = await page.locator('.heroi [data-heroi-acoes] a.btn').first().getAttribute('href');
  const phone = await page.locator('a[href*="teste-no-seu-celular"]').first().getAttribute('href');
  row(10, exp === 'https://logikosvision.com.br/experiencia/' && /\?direto=1$/.test(phone ?? ''), `experiência ${exp} · câmera ${phone}`);

  await page.goto(B + '/integradores');
  await shot('.ph', '08-integradores');
  row(8, /modelo customizado/i.test(await page.locator('h1').innerText()), await page.locator('h1').innerText());

  await page.goto(B + '/robotica');
  await shot('.ph', '09-robotica');
  row(9, (await page.locator('.ph [data-heroi-acoes] [data-cta="experience"]').count()) === 0, 'herói só com "Falar com especialista"');

  await page.goto(B + '/recognition');
  await shot('section[aria-labelledby="readings-title"]', '12-13-recognition');
  const pushes = await page.locator('.leitura .push').count();
  row('12/13', pushes === 6, `${pushes} notificações do app nos 6 cartões`);
  await ctx.close();
}
await browser.close();
for (const r of rows) console.log(`${String(r.n).padEnd(6)} ${r.w.padEnd(5)} ${r.ok ? 'OK ' : 'FALHA'} ${r.note}`);
process.exit(rows.every((r) => r.ok) ? 0 : 1);
