import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Feedback 11/11, item 11: /contato is a conversation with Koda that posts the lead to the CRM.
// The CRM is always intercepted here — never a real request with test data.
const CRM = 'https://brandschutz.logikosvision.com.br/api/lead';

async function answer(page: Page, value: string) {
  await page.locator('[data-campo] input, [data-campo] textarea').first().fill(value);
  await page.keyboard.press('Enter');
}

test('one question at a time, keyboard only, to the CRM contract; Koda thanks by name', async ({ page }) => {
  const posts: Record<string, unknown>[] = [];
  await page.route(CRM, async (route) => {
    expect(route.request().headers()['content-type']).toMatch(/^text\/plain/);
    posts.push(JSON.parse(route.request().postData() ?? '{}'));
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.goto('/contato?interesse=fire#conversa');
  const log = page.locator('[data-log]');
  await expect(log.locator('.msg--koda').last()).toHaveText(/Como você se chama/);
  await answer(page, 'Ana Souza');
  await expect(page.getByLabel(/Prazer, Ana!/)).toBeFocused();
  await answer(page, 'Metalúrgica Exemplo');
  await answer(page, 'ana@exemplo.com.br');
  await answer(page, '(47) 99999-0000');
  await page.getByRole('button', { name: 'Pular', exact: true }).click();
  // The interest from the page's specialist link comes pre-picked.
  await expect(page.getByRole('button', { name: 'Fogo e fumaça' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Contagem' }).click();
  await page.getByRole('button', { name: 'Responder', exact: true }).click();
  await answer(page, 'Duas plantas em SC.');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Enviar para a equipe' }).click();
  const thanks = log.locator('.msg--fim');
  await expect(thanks).toHaveText('Obrigado, Ana! Recebi tudo. Nossa equipe entra em contato assim que possível.');
  await expect(thanks).toBeFocused();
  await expect(page.locator('[data-entrada]')).toBeHidden();
  expect(posts).toHaveLength(1);
  const lead = posts[0] ?? {};
  expect(lead).toMatchObject({
    origem: 'site-logikos-contato',
    nome: 'Ana Souza',
    empresa: 'Metalúrgica Exemplo',
    email: 'ana@exemplo.com.br',
    telefone: '47999990000',
    cargo: '',
    interesse: 'Fogo e fumaça, Contagem',
    notas: 'Duas plantas em SC.',
    consentimento: true,
    consentimento_texto: 'Li a política de privacidade e autorizo o uso destes dados para retorno do contato.',
    website: '',
  });
  expect(String(lead.event_id)).toMatch(/^[0-9a-f-]{36}$/);
  expect(Number.isNaN(Date.parse(String(lead.consentimento_em)))).toBe(false);
  expect(String(lead.pagina)).toContain('/contato');
});

test('an answer can be edited, and errors say what to fix', async ({ page }) => {
  await page.goto('/contato');
  await page.getByRole('button', { name: 'Responder', exact: true }).click();
  await expect(page.locator('[data-erro]')).toHaveText('Preciso dessa resposta para seguir.');
  await expect(page.locator('#chat-nome')).toHaveAttribute('aria-invalid', 'true');
  await answer(page, 'Ana');
  await answer(page, 'ACME');
  await answer(page, 'ana@acme');
  await expect(page.locator('[data-erro]')).toHaveText(/não parece completo/);
  await page.getByRole('button', { name: /Corrigir a resposta: Como você se chama/ }).click();
  await expect(page.locator('#chat-nome')).toHaveValue('Ana');
  await answer(page, 'Ana Lima');
  // Back to the first open question (the email), with the new name in Koda's line.
  await expect(page.locator('#chat-email')).toBeFocused();
  await expect(page.locator('[data-log]')).toContainText('Prazer, Ana!');
});

test('if the CRM fails, Koda says so, keeps the answers and retries with the same event', async ({ page }) => {
  const ids: string[] = [];
  let fail = true;
  await page.route(CRM, async (route) => {
    ids.push(JSON.parse(route.request().postData() ?? '{}').event_id);
    if (fail) return route.fulfill({ status: 500, body: '' });
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.goto('/contato?interesse=epi');
  for (const v of ['Ana', 'ACME', 'ana@acme.com.br', '47999990000']) await answer(page, v);
  await page.getByRole('button', { name: 'Pular', exact: true }).click();
  await page.getByRole('button', { name: 'Responder', exact: true }).click();
  await page.getByRole('button', { name: 'Pular', exact: true }).click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Enviar para a equipe' }).click();
  await expect(page.locator('[data-erro]')).toContainText('Não consegui enviar agora');
  fail = false;
  await page.getByRole('button', { name: 'Tentar de novo' }).click();
  await expect(page.locator('.msg--fim')).toBeVisible();
  expect(ids).toHaveLength(2);
  expect(ids[0]).toBe(ids[1]);
});

test('axe: the conversation has zero violations mid-way and at the consent step', async ({ page }) => {
  await page.goto('/contato?interesse=fire');
  for (const v of ['Ana', 'ACME', 'ana@acme.com.br', '47999990000']) await answer(page, v);
  await page.getByRole('button', { name: 'Pular', exact: true }).click();
  let r = await new AxeBuilder({ page }).include('[data-chat]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(r.violations, JSON.stringify(r.violations, null, 2)).toEqual([]);
  await page.getByRole('button', { name: 'Responder', exact: true }).click();
  await page.getByRole('button', { name: 'Pular', exact: true }).click();
  r = await new AxeBuilder({ page }).include('[data-chat]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(r.violations, JSON.stringify(r.violations, null, 2)).toEqual([]);
});
