import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { stubTurnstile, wranglerLog } from './helpers.ts';

function kvKeys(): string[] {
  const out = execFileSync(
    'pnpm',
    ['exec', 'wrangler', 'kv', 'key', 'list', '--binding', 'LEADS_KV', '--local', '--persist-to', '.wrangler/e2e'],
    { encoding: 'utf8', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } },
  );
  return (JSON.parse(out) as { name: string }[]).map((k) => k.name);
}

test.describe.configure({ mode: 'serial' });

test('server rejects a lead without a Turnstile token and stores nothing', async ({ request }) => {
  const before = kvKeys().length;
  const res = await request.post('/api/lead', {
    headers: { 'Content-Type': 'application/json' },
    data: { kind: 'contact', lang: 'pt-br', name: 'Sem Token', company: 'Teste', email: 'semtoken@example.com', consent: true },
  });
  expect(res.status()).toBe(400);
  expect(await res.json()).toEqual({ ok: false, error: 'verification' });
  expect(kvKeys().length).toBe(before);
});

test('server rejects cross-origin posts, wrong content types and other methods', async ({ request }) => {
  const cross = await request.post('/api/lead', {
    headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' },
    data: { turnstileToken: 't' },
  });
  expect(cross.status()).toBe(403);
  const form = await request.post('/api/lead', { form: { name: 'x' } });
  expect(form.status()).toBe(415);
  expect((await request.get('/api/lead')).status()).toBe(405);
});

test('client validation blocks an empty submit and marks fields', async ({ page }) => {
  await stubTurnstile(page);
  await page.goto('/contato');
  const form = page.locator('#formulario');
  await form.locator('button[type="submit"]').click();
  const status = form.locator('[data-status]');
  await expect(status).toHaveAttribute('data-kind', 'invalid');
  // State = color + icon + word.
  await expect(status.locator('.state.state--warn svg path').first()).toBeAttached();
  await expect(status.locator('[data-status-text]')).not.toHaveText('');
  const name = form.locator('input[name="name"]');
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(form.locator('input[name="consent"]')).toHaveAttribute('aria-invalid', 'true');
  // The highlight is visible, and each invalid field has its own icon + word, linked for AT.
  const alert = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--lk-alert').trim());
  const border = await name.evaluate((el) => getComputedStyle(el).borderTopColor);
  const toRgb = (hex: string) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
  expect(border).toBe(toRgb(alert));
  for (const field of ['name', 'company', 'email', 'consent']) {
    const err = form.locator(`#formulario-${field}-error`);
    await expect(err).toBeVisible();
    await expect(err.locator('svg')).toHaveCount(1);
    await expect(err.locator('[data-error-text]')).not.toHaveText('');
    await expect(form.locator(`#formulario-${field}`)).toHaveAttribute('aria-describedby', new RegExp(`formulario-${field}-error`));
  }
  // Fixing a field clears its error.
  await name.fill('Ana');
  await expect(form.locator('#formulario-name-error')).toBeHidden();
  await expect(name).not.toHaveAttribute('aria-invalid', 'true');
});

test('fields rejected by the server (422) are marked with icon + word and focused', async ({ page }) => {
  await stubTurnstile(page);
  await page.route('**/api/lead', (route) =>
    route.fulfill({
      status: 422,
      contentType: 'application/json',
      body: JSON.stringify({ ok: false, error: 'invalid', fields: ['whatsapp'] }),
    }),
  );
  await page.goto('/contato');
  const form = page.locator('#formulario');
  await form.locator('input[name="name"]').fill('Ana');
  await form.locator('input[name="company"]').fill('ACME');
  await form.locator('input[name="email"]').fill('ana@acme.example');
  await form.locator('input[name="whatsapp"]').fill('47 99999 0000');
  await form.locator('input[name="consent"]').check();
  await form.locator('button[type="submit"]').click();
  const wa = form.locator('input[name="whatsapp"]');
  await expect(wa).toHaveAttribute('aria-invalid', 'true');
  await expect(wa).toBeFocused();
  await expect(form.locator('#formulario-whatsapp-error')).toBeVisible();
  await expect(form.locator('#formulario-whatsapp-error svg')).toHaveCount(1);
  await wa.fill('47 99999 0001');
  await expect(form.locator('#formulario-whatsapp-error')).toBeHidden();
});

test('client patterns match the server: malformed e-mail and phone are caught before sending', async ({ page }) => {
  await stubTurnstile(page);
  let posted = false;
  await page.route('**/api/lead', (route) => {
    posted = true;
    return route.abort();
  });
  await page.goto('/contato');
  const form = page.locator('#formulario');
  await form.locator('input[name="name"]').fill('Ana');
  await form.locator('input[name="company"]').fill('ACME');
  await form.locator('input[name="email"]').fill('joao@empresa');
  await form.locator('input[name="whatsapp"]').fill('ramal 12');
  await form.locator('input[name="consent"]').check();
  await form.locator('button[type="submit"]').click();
  await expect(form.locator('input[name="email"]')).toHaveAttribute('aria-invalid', 'true');
  await expect(form.locator('input[name="whatsapp"]')).toHaveAttribute('aria-invalid', 'true');
  expect(posted).toBe(false);
});

for (const [path, id, lang] of [
  ['/contato', 'formulario', 'pt-br'],
  ['/en/partners', 'parceria', 'en'],
] as const) {
  test(`valid lead from ${path} is stored (proved by KV listing) and never logged`, async ({ page }) => {
    await stubTurnstile(page);
    const stamp = `${lang}-${Date.now()}`;
    const values = {
      name: `Pessoa ${stamp}`,
      company: `Empresa ${stamp}`,
      email: `lead.${stamp}@example.com`,
      message: `Mensagem ${stamp}`,
    };
    const before = kvKeys();
    await page.goto(path);
    const form = page.locator(`#${id}`);
    await form.locator('input[name="name"]').fill(values.name);
    await form.locator('input[name="company"]').fill(values.company);
    await form.locator('input[name="email"]').fill(values.email);
    await form.locator('textarea[name="message"]').fill(values.message);
    await form.locator('input[name="interests"][value="epi"]').check();
    await form.locator('input[name="consent"]').check();
    await form.locator('button[type="submit"]').click();
    const status = form.locator('[data-status]');
    await expect(status).toHaveAttribute('data-kind', /success|verification|error/);
    // Sandboxes without egress to challenges.cloudflare.com cannot complete siteverify.
    // In GitHub Actions this never skips: the lead must be stored.
    test.skip(
      !process.env.GITHUB_ACTIONS &&
        (await status.getAttribute('data-kind')) === 'verification' &&
        wranglerLog().includes('turnstile_failed'),
      'Turnstile siteverify unreachable from this sandbox; always enforced in GitHub Actions.',
    );
    await expect(status).toHaveAttribute('data-kind', 'success');

    const added = kvKeys().filter((k) => !before.includes(k));
    expect(added).toHaveLength(1);
    expect(added[0]).toMatch(/^lead:\d{4}-\d{2}-\d{2}T/);
    for (const v of Object.values(values)) expect(added[0]).not.toContain(v);
    const log = wranglerLog();
    expect(log).toContain('"evt":"lead.stored"');
    for (const v of Object.values(values)) expect(log).not.toContain(v);
  });
}
