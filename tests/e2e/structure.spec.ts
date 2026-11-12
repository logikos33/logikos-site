import { expect, test } from '@playwright/test';
import { ALL_ROUTES, skipOpening } from './helpers.ts';

test.beforeEach(async ({ page }) => {
  await skipOpening(page);
});

test('home v3: sections in the approved order, Koda right after the partners, leading to the experience', async ({ page }) => {
  for (const path of ['/', '/en/']) {
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const order = await page
      .locator('main section[aria-labelledby], main .parceiros')
      .evaluateAll((els) => els.map((e) => (e.classList.contains('parceiros') ? 'parceiros' : (e.getAttribute('aria-labelledby') ?? ''))));
    expect(order, path).toEqual([
      'hero-title',
      'parceiros',
      'koda-title',
      'problema-title',
      'cenarios-title',
      'faixa-title',
      'como-title',
      'prova-title',
      'dados-title',
      'faq-title',
      'contato-title',
    ]);
    // Koda: own section with the tour CTA, peeking at the wall in the hero, and out of the contact card.
    await expect(page.locator('section.koda a.btn')).toHaveAttribute('href', 'https://logikosvision.com.br/experiencia/');
    await expect(page.locator('.espia')).toHaveAttribute('href', 'https://logikosvision.com.br/experiencia/');
    await expect(page.locator('#contato img')).toHaveCount(0);
    // No lead form on the home any more; the wall's sixth tile is the phone demo.
    await expect(page.locator('main form')).toHaveCount(0);
    await expect(page.locator('.muro .cam--voce')).toHaveAttribute('href', 'https://logikosvision.com.br/teste-no-seu-celular/?direto=1');
  }
});

test('every "talk to a specialist" opens the conversation with Koda (feedback 11/11, item 11)', async ({ page }) => {
  for (const path of ['/', '/recognition', '/integradores', '/robotica', '/en/']) {
    await page.goto(path);
    const hrefs = await page
      .locator('a')
      .evaluateAll((els) =>
        els
          .filter((e) => /especialista|specialist|seu modelo|your model/i.test(e.textContent ?? ''))
          .map((e) => e.getAttribute('href') ?? ''),
      );
    expect(hrefs.length, path).toBeGreaterThanOrEqual(2);
    for (const href of hrefs) expect(href, path).toMatch(/^\/(en\/contact|contato)(\?interesse=[a-z]+)?#conversa$/);
  }
});

test('section heads speak for themselves: the question is for screen readers only, at every width', async ({ browser }) => {
  for (const width of [1440, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 844 } });
    const page = await ctx.newPage();
    await page.goto('/sobre');
    await expect(page.locator('main > section .q').first()).toBeHidden();
    await expect(page.locator('main > section .q-sr').first()).toHaveText(/\?/);
    await ctx.close();
  }
});

// Feedback 11/11, item 5: every footer page in the home's language — real clips (no generated
// poster), the same CTA pair in the hero and the phone-camera close.
test('footer pages: real media, the hero CTA pair and the phone-camera close', async ({ page }) => {
  const MEDIA = ['/recognition', '/demos', '/integradores', '/robotica', '/sobre', '/como-funciona', '/plataforma', '/twins'];
  for (const path of [...MEDIA, '/conformidade', '/contato', '/privacidade']) {
    await page.goto(path);
    await expect(page.locator('html'), path).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('img[src*="/media/posters/"]'), `${path}: generated poster`).toHaveCount(0);
    if (!MEDIA.includes(path)) continue;
    await expect(page.locator('.ph__media img[src^="/media/home/"]').first(), `${path}: real media`).toBeVisible();
    // Sobre and Robótica keep only their own call (final review, items 5 and 9).
    await expect(page.locator('.ph [data-heroi-acoes] .btn'), `${path}: hero CTAs`).toHaveCount(
      ['/sobre', '/robotica'].includes(path) ? 1 : 2,
    );
    await expect(
      page.locator('.fecho a[href="https://logikosvision.com.br/teste-no-seu-celular/?direto=1"]'),
      `${path}: phone demo`,
    ).toHaveCount(1);
  }
});

test('nav has six items and no "Entrar" anywhere; /entrar goes home (feedback 11/11)', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('.site-nav a')).toHaveCount(6);
  for (const path of ['/', '/plataforma', '/en/platform', '/contato']) {
    await page.goto(path);
    await expect(page.locator('a[href*="railway.app"], a[href*="/login"], [data-login]'), path).toHaveCount(0);
    await expect(page.getByRole('link', { name: /^(Entrar|Sign in)\b/ }), path).toHaveCount(0);
  }
  for (const [from, to] of [
    ['/entrar', '/'],
    ['/en/sign-in', '/en/'],
  ] as const) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status(), from).toBe(302);
    expect(new URL(res.headers()['location'] ?? '', 'http://x').pathname, from).toBe(to);
  }
});

test('no generic tells in the built pages: arrows in links, decorative eyebrows, card grids', async ({ page }) => {
  for (const { path } of ALL_ROUTES) {
    await page.goto(path);
    const arrows = await page.locator('a, button').evaluateAll((els) => els.filter((e) => /→|&rarr;/.test(e.textContent ?? '')).length);
    expect(arrows, `${path}: arrows`).toBe(0);
    const eyebrows = await page.locator('.eyebrow').count();
    // Only the 404 (code) may carry an eyebrow.
    expect(eyebrows, `${path}: eyebrows`).toBe(0);
    expect(await page.locator('.card').count(), `${path}: cards`).toBe(0);
    expect(await page.locator('.grid--5, .grid--3').count(), `${path}: grids`).toBe(0);
  }
});

test('home channels: a real carousel — arrows, ruler and swipe move the slides; only the shown one is reachable', async ({ page }) => {
  await page.goto('/?sem-abertura');
  const slides = page.locator('[data-slide]');
  const marks = page.locator('[data-ir]');
  // Rodada soluções: ergonomics leads (CH1) and workstation presence joins as CH7.
  await expect(slides).toHaveCount(7);
  await expect(marks.nth(0)).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('#painel-fogo')).toHaveAttribute('inert', '');
  await page.locator('[data-proximo]').click();
  await expect(marks.nth(1)).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('#painel-fogo')).not.toHaveAttribute('inert', '');
  await expect(page.locator('#painel-ergonomia')).toHaveAttribute('inert', '');
  await marks.nth(3).click();
  await expect(marks.nth(3)).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('#painel-qualidade')).toBeInViewport({ ratio: 0.6 });
  await page.locator('[data-anterior]').click();
  await expect(marks.nth(2)).toHaveAttribute('aria-current', 'true');
  // A swipe is a native scroll of the track: the slide that settles becomes the current one.
  await page.locator('[data-trilho]').evaluate((t) => t.scrollTo({ left: (t.firstElementChild as HTMLElement).offsetWidth * 4 + 200 }));
  await expect(marks.nth(4)).toHaveAttribute('aria-current', 'true');
  // The fire slide links to its scenario in the experience.
  await expect(page.locator('#painel-fogo a.btn')).toHaveAttribute('href', /experiencia\/\?cenario=fogo$/);
});

test('home channels: the carousel advances on its own when its progress rule fills', async ({ page }) => {
  await page.goto('/?sem-abertura');
  await page.locator('#cenarios .cab').scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(page.locator('[data-carrossel]')).toHaveClass(/em-tela/);
  // Skip the 7 s timer: finish the running progress animation.
  await page.evaluate(() => document.getAnimations().forEach((a) => (a as CSSAnimation).animationName === 'progresso' && a.finish()));
  await expect(page.locator('[data-ir]').nth(1)).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('#painel-fogo')).toBeInViewport({ ratio: 0.6 });
});

test('every HUD figure carries a two-cell caption (machine | person) and the poster already shows the verdict', async ({ page }) => {
  // The simulated HUD left the public pages (feedback 11/11); it is kept on the internal brand page.
  await page.goto('/_marca');
  const figs = page.locator('[data-hud]');
  expect(await figs.count()).toBeGreaterThan(0);
  for (let i = 0; i < (await figs.count()); i++) {
    const f = figs.nth(i);
    await expect(f.locator('[data-hud-machine]')).toHaveText(/CAM \d{2} · \d{2}:\d{2}:\d{2} · /);
    await expect(f.locator('[data-hud-person-text]')).not.toHaveText('');
    const poster = f.locator('img.hud__poster:not([hidden]), video[poster]').first();
    await expect(poster, `figure ${i} has a poster at rest`).toHaveCount(1);
  }
  // The verdict poster (no-JS fallback) carries the last frame's boxes; the plain one does not.
  const verdict = await (await page.request.get('/media/posters/pt-br/fire.svg')).text();
  const plain = await (await page.request.get('/media/posters/pt-br/fire-plain.svg')).text();
  expect(verdict).toContain('hud-pbox');
  expect(plain).not.toContain('hud-pbox');
});

test('buttons: one size, a visible hover (cyan as state), and one pair of CTAs on screen at a time', async ({ page }) => {
  for (const path of ['/', '/en/']) {
    await page.goto(path);
    // Every call to action on the home is 48 px; the header uses the compact 44 px size.
    const heights = await page
      .locator('main .btn, .barra .btn')
      .evaluateAll((els) => [
        ...new Set(els.filter((e) => e.getClientRects().length).map((e) => Math.round(e.getBoundingClientRect().height))),
      ]);
    expect(heights, path).toEqual([48]);
    // Header CTAs wait while the hero's are on screen, then appear.
    const headerCta = page.locator('.site-header__cta[data-cta="experience"]');
    await expect(headerCta).toBeHidden();
    await page.locator('#cenarios').scrollIntoViewIfNeeded();
    await expect(headerCta).toBeVisible();
    // Hover changes the primary button (never a dead button), from white to the accent.
    const btn = page.locator('#painel-fogo a.btn');
    await btn.scrollIntoViewIfNeeded();
    const rest = await btn.evaluate((e) => getComputedStyle(e).backgroundColor);
    await btn.hover();
    await expect.poll(() => btn.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(0, 229, 255)');
    expect(rest).not.toBe('rgb(0, 229, 255)');
  }
  // Koda's link is only Koda and the balloon, not an invisible strip under the wall.
  await page.goto('/');
  const peek = await page.locator('.espia').boundingBox();
  expect(peek?.width ?? 999).toBeLessThan(420);
});

// Feedback 11/11, item 15: CATH, BrandSchutz, Visdec in a still row, whole (no mask, nothing past the
// row's edges), at desktop and phone widths.
test('partner logos: a still row of four whole logos, no mask', async ({ browser }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    const ctx = await browser.newContext({ viewport });
    await ctx.addInitScript(() => sessionStorage.setItem('lk-abertura', '1'));
    const page = await ctx.newPage();
    await page.goto('/');
    const row = page.locator('.logos');
    await row.scrollIntoViewIfNeeded();
    await expect(row.locator('img')).toHaveCount(4);
    expect(await row.locator('img').evaluateAll((is) => is.map((i) => i.getAttribute('src')?.split('/').pop()))).toEqual([
      'l-cath-v2.webp',
      'l-brandschutz.webp',
      'l-visdec-v2.webp',
      'l-infra.webp',
    ]);
    const clipped = await row.evaluate((ul) => {
      const r = ul.getBoundingClientRect();
      const masked = getComputedStyle(ul).maskImage !== 'none' || getComputedStyle(ul.parentElement as Element).maskImage !== 'none';
      const out = [...ul.querySelectorAll('img')].some((i) => {
        const b = i.getBoundingClientRect();
        return b.left < r.left - 1 || b.right > r.right + 1 || b.right > window.innerWidth || i.naturalWidth === 0;
      });
      return masked || out;
    });
    expect(clipped, `${viewport.width}px`).toBe(false);
    expect(await page.evaluate(() => document.getAnimations().some((a) => (a as CSSAnimation).animationName === 'corre'))).toBe(false);
    await ctx.close();
  }
});
