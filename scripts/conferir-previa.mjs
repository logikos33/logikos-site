// Feedback 11/11, items 9-26: checks each item on a published preview at 1440×900 and 390×844 and
// saves one print per item and width. Usage: node scripts/conferir-previa.mjs <outDir> [baseUrl]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const OUT = process.argv[2] ?? 'docs/design/feedback-vitor-11-11/rodada-4';
const B = process.argv[3] ?? 'https://pr-48.logikos-site.pages.dev';
const PHONE = 'https://logikosvision.com.br/teste-no-seu-celular/';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const rows = [];
const ok = (item, w, pass, note) => rows.push({ item, w, pass, note });

for (const [w, viewport, mobile] of [
  ['1440', { width: 1440, height: 900 }, false],
  ['390', { width: 390, height: 844 }, true],
]) {
  const ctx = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile });
  await ctx.addInitScript(() => sessionStorage.setItem('lk-abertura', '1'));
  const page = await ctx.newPage();
  const turnstile = [];
  page.on('request', (r) => r.url().includes('challenges.cloudflare.com') && turnstile.push(r.url()));
  const shot = async (sel, name) => {
    const el = page.locator(sel).first();
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await el.screenshot({ path: `${OUT}/${name}-${w}.jpg`, type: 'jpeg', quality: 72 });
  };

  // Home: 9 carousel, 10/15 logos, 23 CAM 07, 12 backdrop
  await page.goto(B + '/');
  await page.locator('[data-carrossel]').scrollIntoViewIfNeeded();
  await page.mouse.move(2, 2);
  const times = await page.evaluate(
    () =>
      new Promise((res) => {
        const marks = [...document.querySelectorAll('[data-ir]')];
        const at = () => marks.findIndex((m) => m.getAttribute('aria-current') === 'true');
        let last = at();
        let t0 = performance.now();
        const out = [];
        const iv = setInterval(() => {
          const now = at();
          if (now !== last) {
            out.push(Math.round(performance.now() - t0));
            t0 = performance.now();
            last = now;
          }
          if (out.length >= 2) {
            clearInterval(iv);
            res(out);
          }
        }, 50);
      }),
  );
  await page.locator('[data-carrossel]').hover();
  await page.waitForTimeout(900);
  await shot('[data-carrossel]', '09-carrossel');
  ok(
    '9',
    w,
    times.every((t) => t > 2700 && t < 3400),
    `trocas ${times.join(' / ')} ms`,
  );
  await shot('.parceiros', '10-15-logos');
  const logos = await page.evaluate(() => {
    const ul = document.querySelector('.logos');
    if (!ul) return { n: 0, inside: false, masked: true };
    const r = ul.getBoundingClientRect();
    const imgs = [...ul.querySelectorAll('img')];
    return {
      n: imgs.length,
      inside: imgs.every((i) => {
        const b = i.getBoundingClientRect();
        return b.left >= r.left - 1 && b.right <= Math.min(r.right, innerWidth) + 1 && i.naturalWidth > 0;
      }),
      masked: getComputedStyle(ul).maskImage !== 'none',
      srcs: imgs.map((i) => i.getAttribute('src')?.split('/').pop()),
    };
  });
  ok(
    '10/15',
    w,
    logos.n === 3 && logos.inside && !logos.masked,
    `${logos.srcs?.join(', ')} · inteiras=${logos.inside} · máscara=${logos.masked}`,
  );
  await shot('#contato .sinal, .fecho .sinal', '23-cam07');
  const clock = await page.locator('[data-relogio]').last().textContent();
  ok('23', w, Boolean(clock && /\d\d:\d\d:\d\d/.test(clock)), `relógio ${clock} · conectando visível`);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: `${OUT}/12-fundo-tv-${w}.jpg`,
    type: 'jpeg',
    quality: 80,
    clip: mobile ? { x: 0, y: 560, width: 390, height: 260 } : { x: 700, y: 640, width: 500, height: 240 },
  });
  const crt = await page.evaluate(() => ({
    before: getComputedStyle(document.body, '::before').backgroundImage.startsWith('repeating'),
    after: /ruido-v2/.test(getComputedStyle(document.body, '::after').backgroundImage),
  }));
  ok('12', w, crt.before && crt.after, 'scanlines + grão no body');

  // 14 header B + footer A
  await shot('.site-header', '14-header-B');
  await shot('.site-footer__brand', '14-rodape-A');
  ok(
    '14',
    w,
    (await page.locator('.site-header__vision').count()) === 1 &&
      (await page.locator('.site-footer svg[data-brand="lockup"]').count()) === 1,
    'header LOGIKOS | VISION · rodapé lockup A',
  );

  // 11 conversation
  await page.goto(B + '/contato');
  await shot('[data-chat]', '11-conversa');
  ok('11', w, (await page.locator('[data-chat] [data-log] .msg--koda').count()) >= 2, 'Koda pergunta uma coisa por vez');

  // 13 + 24 Recognition cards
  await page.goto(B + '/recognition');
  await shot('section[aria-labelledby="readings-title"]', '13-24-cenarios');
  ok(
    '13/24',
    w,
    (await page.locator('.leitura.folha').count()) === 6 && (await page.locator('.chamada').count()) === 1,
    '6 cartões claros + chamada de indicadores',
  );

  // 16 box
  await page.goto(B + '/como-funciona');
  const box = page.locator('[data-caixa]');
  await box.scrollIntoViewIfNeeded();
  await page.waitForTimeout(3200);
  await box.screenshot({ path: `${OUT}/16-caixa-${w}.jpg`, type: 'jpeg', quality: 72 });
  ok('16', w, /abre/.test((await box.getAttribute('class')) ?? ''), 'abriu uma vez ao entrar na tela');

  // 17 licence + 19 form + 20 no Turnstile
  await page.goto(B + '/plataforma');
  await shot('.licenca', '17-licenca');
  ok('17', w, (await page.locator('.licenca .opcao--top').count()) === 1, 'mensal / anual / bienal (destacada)');
  await shot('#conta', '19-formulario-conta');
  ok(
    '19',
    w,
    (await page.locator('#conta input:not([type="checkbox"]):not([name="website"])').count()) === 5,
    'nome, empresa, câmeras, e-mail, WhatsApp + modelo + aceite',
  );
  await page.goto(B + '/integradores');
  await shot('#parceria', '19-formulario-integrador');

  // 18 demos
  await page.goto(B + '/demos');
  await page.screenshot({ path: `${OUT}/18-demos-${w}.jpg`, type: 'jpeg', quality: 60, fullPage: true });
  ok('18', w, true, 'uma chamada, vídeos lado a lado');

  // 21 demo links
  let bad = 0;
  let good = 0;
  for (const p of ['/', '/demos', '/recognition', '/sobre']) {
    await page.goto(B + p);
    bad += await page.locator('a[href*="railway.app"], a[href$="/demo/"]').count();
    good += await page.locator(`a[href="${PHONE}"]`).count();
  }
  ok('21', w, bad === 0 && good > 0, `${good} links para /teste-no-seu-celular/, ${bad} antigos`);

  // 22 privacy
  await page.goto(B + '/privacidade');
  ok('22', w, !/a definir/i.test(await page.locator('main').innerText()), 'sem "a definir"');

  // 26 about
  await page.goto(B + '/sobre');
  await page.screenshot({ path: `${OUT}/26-sobre-${w}.jpg`, type: 'jpeg', quality: 60, fullPage: true });
  ok(
    '26',
    w,
    (await page.getByRole('link', { name: 'Solicite seu modelo customizado' }).count()) === 2,
    'manifesto → frentes → como → onde → CTA',
  );

  ok('20', w, turnstile.length === 0, `${turnstile.length} requisições ao Turnstile em todas as páginas abertas`);
  await ctx.close();
}
await browser.close();
for (const r of rows) console.log(`${r.item.padEnd(6)} ${r.w.padEnd(5)} ${r.pass ? 'OK ' : 'FALHA'} ${r.note}`);
process.exit(rows.every((r) => r.pass) ? 0 : 1);
