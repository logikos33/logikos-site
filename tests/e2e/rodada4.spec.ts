import { expect, test, type Page } from '@playwright/test';
import { skipOpening } from './helpers.ts';

// Feedback 11/11, round 4 (items 14-26). The CRM is always intercepted: no real request.
const CRM = 'https://brandschutz.logikosvision.com.br/api/lead';

test.beforeEach(async ({ page }) => skipOpening(page));

async function capture(page: Page) {
  const posts: Record<string, unknown>[] = [];
  await page.route(CRM, async (route) => {
    expect(route.request().headers()['content-type']).toMatch(/^text\/plain/);
    posts.push(JSON.parse(route.request().postData() ?? '{}'));
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  return posts;
}

for (const [path, id, origem] of [
  ['/plataforma', 'conta', 'site-logikos-conta'],
  ['/integradores', 'parceria', 'site-logikos-integrador'],
] as const) {
  test(`items 19-20: the ${id} form is short, has no Turnstile and posts to the CRM`, async ({ page }) => {
    const posts = await capture(page);
    const external: string[] = [];
    page.on('request', (r) => r.url().includes('challenges.cloudflare.com') && external.push(r.url()));
    await page.goto(path);
    const form = page.locator(`#${id}`);
    // Empty submit: every required field says what to fix; nothing is sent.
    await form.getByRole('button').last().click();
    await expect(form.locator('[aria-invalid="true"]').first()).toBeFocused();
    expect(posts).toHaveLength(0);
    await form.locator('input[name="nome"]').fill('Ana Souza');
    await form.locator('input[name="empresa"]').fill('Metalúrgica Exemplo');
    await form.locator('input[name="cameras"]').fill('12');
    await form.locator('input[name="email"]').fill('ana@exemplo.com.br');
    await form.locator('input[name="telefone"]').fill('(47) 99999-0000');
    await form.getByRole('checkbox', { name: 'EPI', exact: true }).check();
    await form.getByRole('checkbox', { name: 'Contagem', exact: true }).check();
    await form.locator('input[name="aceite"]').check();
    await form.getByRole('button').last().click();
    await expect(form.locator('[data-status]')).toHaveAttribute('data-kind', 'success');
    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({
      origem,
      nome: 'Ana Souza',
      empresa: 'Metalúrgica Exemplo',
      email: 'ana@exemplo.com.br',
      telefone: '47999990000',
      cameras: 12,
      faixa_cameras: '11-30',
      interesse: 'EPI, Contagem',
      consentimento: true,
      website: '',
    });
    expect(external).toEqual([]);
    // Only the fields asked for: name, company, cameras, email, WhatsApp (+ chips, consent, honeypot).
    expect(await form.locator('input:not([type="checkbox"]):not([name="website"])').count()).toBe(5);
  });
}

test('items 17 and 25d: licence terms monthly / annual / biennial, biennial highlighted, on every page that sells', async ({ page }) => {
  for (const path of ['/como-funciona', '/plataforma', '/en/platform']) {
    await page.goto(path);
    const options = page.locator('.licenca .opcao');
    await expect(options, path).toHaveCount(3);
    await expect(page.locator('.licenca .opcao--top'), path).toHaveCount(1);
    await expect(page.locator('.licenca .opcao--top .opcao__selo'), path).toBeVisible();
  }
});

test('item 16: the Logikos box opens once when it enters the view, markers in order', async ({ page }) => {
  await page.goto('/como-funciona');
  const box = page.locator('[data-caixa]');
  await expect(box).toHaveClass(/armada/);
  await expect(box).not.toHaveClass(/abre/);
  await box.scrollIntoViewIfNeeded();
  await expect(box).toHaveClass(/abre/);
  await expect(box.locator('.caixa__marca').last()).toHaveCSS('opacity', '1', { timeout: 5000 });
  await expect(box.locator('.caixa__rotulo')).toHaveText([/Equipamento/, /rede/, /energia/]);
});

test('item 16: with reduced motion the box rests open with the markers', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/como-funciona');
  const box = page.locator('[data-caixa]');
  await expect(box).not.toHaveClass(/armada/);
  await expect(box.locator('.caixa__aberta')).toHaveCSS('opacity', '1');
  await ctx.close();
});

test('item 14: header and footer show the Logikos Vision lockup, direction A, VISION legible', async ({ page }) => {
  await page.goto('/sobre');
  const lockup = page.locator('.site-header__logo svg[data-brand="lockup"]');
  // VISION's cap is 36 of the lockup's 163.5 units: at least ~11 px on desktop.
  expect(((await lockup.boundingBox())?.height ?? 0) * (36 / 163.5)).toBeGreaterThanOrEqual(11);
  expect(await lockup.evaluate((el) => getComputedStyle(el).filter)).toContain('drop-shadow');
  await expect(page.locator('.site-header__logo')).toHaveAttribute('aria-label', /Logikos Vision/);
  await expect(page.locator('.site-footer svg[data-brand="lockup"]')).toHaveAttribute('aria-label', 'Logikos Vision');
});

test('item 21 and 25c: every demo link is the phone demo on the site, never the old demos', async ({ page }) => {
  for (const path of ['/', '/demos', '/recognition', '/en/demos']) {
    await page.goto(path);
    await expect(page.locator('a[href*="railway.app"], a[href$="/demo/"]'), path).toHaveCount(0);
    expect(await page.locator('a[href="https://logikosvision.com.br/teste-no-seu-celular/"]').count(), path).toBeGreaterThan(0);
  }
});

test('item 24: six scenario cards with a sample alert and a next step, plus the indicators call', async ({ page }) => {
  await page.goto('/recognition');
  const cards = page.locator('.leitura');
  await expect(cards).toHaveCount(6);
  for (const card of await cards.all()) {
    await expect(card.locator('.leitura__exemplo')).not.toHaveText('');
    await expect(card.locator('.leitura__proximo')).toHaveAttribute('href', /experiencia\/\?cenario=|contato\?interesse=/);
  }
  await expect(page.locator('.chamada a')).toHaveAttribute('href', /contato\?interesse=custom#conversa$/);
});

test('item 26: About asks for a custom model, hero and close', async ({ page }) => {
  await page.goto('/sobre');
  const asks = page.getByRole('link', { name: 'Solicite seu modelo customizado' });
  await expect(asks).toHaveCount(2);
  for (const a of await asks.all()) await expect(a).toHaveAttribute('href', '/contato?interesse=custom#conversa');
});

test('item 22: no "to be defined" left for the public', async ({ page }) => {
  for (const path of ['/privacidade', '/en/privacy']) {
    await page.goto(path);
    await expect(page.locator('main')).not.toContainText(/a definir|to be (appointed|set|defined)/i);
  }
});

test('item 23: the CAM 07 monitors show the waiting loop with a running clock', async ({ page }) => {
  await page.goto('/sobre');
  const clock = page.locator('.fecho [data-relogio]');
  await clock.scrollIntoViewIfNeeded();
  const first = await clock.textContent();
  await expect(clock).not.toHaveText(first ?? '', { timeout: 3000 });
  await expect(page.locator('.fecho .ag__con')).toBeVisible();
});

// Round 5.
test('round 5: "Dentro da planta" has the box beside it and its link as a secondary button', async ({ page }) => {
  await page.goto('/recognition');
  const where = page.locator('section[aria-labelledby="where-title"]');
  await expect(where.locator('[data-caixa]')).toHaveCount(1);
  await expect(where.locator('.q-actions a.btn.btn--ghost')).toHaveAttribute('href', '/como-funciona');
});

test('round 5: CH6 digital twin in the carousel and on the Twins hero, with WebM and MP4', async ({ page }) => {
  await page.goto('/?sem-abertura');
  const slide = page.locator('#painel-gemeo');
  await expect(slide.locator('video')).toHaveAttribute('data-webm', /v-gemeo\.webm$/);
  await expect(slide.locator('video')).toHaveAttribute('data-src', /v-gemeo\.mp4$/);
  await expect(slide.locator('a.btn')).toHaveAttribute('href', '/contato?interesse=twins#conversa');
  await expect(slide).toContainText(/peça/);
  await page.goto('/twins');
  await expect(page.locator('.ph__media video')).toHaveAttribute('data-webm', /v-gemeo\.webm$/);
  await expect(page.locator('main')).toContainText('Gêmeo de cada peça');
});
