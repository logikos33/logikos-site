// Unit tests for the Pages Function and the shared lead contract (node:test, no deps).
// Run: node --test tests/unit/
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import { isPreviewHost, onRequest, onRequestPost, type Env } from '../../functions/api/lead.ts';
import { validateLead } from '../../src/lib/lead.ts';

const PII = { name: 'Maria Teste', company: 'ACME Metal', email: 'maria@acme.example', whatsapp: '+55 47 99999-0000', message: 'olá' };
const VALID = {
  kind: 'contact',
  lang: 'pt-br',
  ...PII,
  role: 'TST',
  interests: ['epi', 'fire'],
  consent: true,
  page: '/contato',
  turnstileToken: 'tok',
};

function req(body: unknown, opts: { origin?: string; type?: string; host?: string } = {}): Request {
  const host = opts.host ?? 'logikos-site.pages.dev';
  return new Request(`https://${host}/api/lead`, {
    method: 'POST',
    headers: { 'Content-Type': opts.type ?? 'application/json', ...(opts.origin ? { Origin: opts.origin } : {}) },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

class FakeKV {
  store = new Map<string, { value: string; metadata?: Record<string, string> }>();
  async put(key: string, value: string, options?: { metadata?: Record<string, string> }) {
    this.store.set(key, { value, ...(options?.metadata ? { metadata: options.metadata } : {}) });
  }
}

let logs: string[] = [];
let siteverify: { success: boolean } = { success: true };
let apiStatus = 200;
let apiCalls: { url: string; body: string; auth: string | null }[] = [];

beforeEach(() => {
  logs = [];
  siteverify = { success: true };
  apiStatus = 200;
  apiCalls = [];
  mock.method(console, 'log', (...args: unknown[]) => logs.push(args.join(' ')));
  mock.method(console, 'error', (...args: unknown[]) => logs.push(args.join(' ')));
  mock.method(globalThis, 'fetch', async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.includes('challenges.cloudflare.com')) return new Response(JSON.stringify(siteverify), { status: 200 });
    apiCalls.push({ url, body: String(init?.body ?? ''), auth: new Headers(init?.headers).get('Authorization') });
    return new Response('{}', { status: apiStatus });
  });
});

afterEach(() => mock.restoreAll());

function assertNoPiiLogged() {
  const all = logs.join('\n');
  for (const v of Object.values(PII)) assert.ok(!all.includes(v), `log leaked "${v}"`);
}

describe('POST /api/lead', () => {
  it('rejects a request without Turnstile token (400) and stores nothing', async () => {
    const kv = new FakeKV();
    const noToken: Record<string, unknown> = { ...VALID };
    delete noToken.turnstileToken;
    const res = await onRequestPost({ request: req(noToken), env: { LEADS_KV: kv } });
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { ok: false, error: 'verification' });
    assert.equal(kv.store.size, 0);
    assertNoPiiLogged();
  });

  it('rejects when Turnstile verification fails (403)', async () => {
    siteverify = { success: false };
    const kv = new FakeKV();
    const res = await onRequestPost({ request: req(VALID), env: { LEADS_KV: kv } });
    assert.equal(res.status, 403);
    assert.equal(kv.store.size, 0);
  });

  it('fails closed on a production host without TURNSTILE_SECRET_KEY', async () => {
    const kv = new FakeKV();
    const res = await onRequestPost({ request: req(VALID, { host: 'logikosvision.com.br' }), env: { LEADS_KV: kv } });
    assert.equal(res.status, 503);
    assert.equal(kv.store.size, 0);
  });

  it('stores a valid lead in KV when no API is configured, with origem=site and idioma', async () => {
    const kv = new FakeKV();
    const res = await onRequestPost({ request: req(VALID), env: { LEADS_KV: kv } });
    assert.equal(res.status, 200);
    assert.equal(kv.store.size, 1);
    const [key, entry] = [...kv.store][0] ?? [];
    assert.match(key ?? '', /^lead:\d{4}-\d{2}-\d{2}T[^:]+:\d{2}:\d{2}\.\d{3}Z:[0-9a-f-]{36}$/);
    const lead = JSON.parse(entry?.value ?? '{}');
    assert.equal(lead.origem, 'site');
    assert.equal(lead.idioma, 'pt-br');
    assert.equal(lead.tipo, 'contact');
    assert.equal(lead.fallback, 'api_not_configured');
    assert.deepEqual(lead.interesses, ['epi', 'fire']);
    assert.equal(lead.consentimento.aceito, true);
    assert.deepEqual(entry?.metadata, { tipo: 'contact', idioma: 'pt-br', origem: 'site' });
    for (const v of Object.values(PII)) assert.ok(!(key ?? '').includes(v));
    assertNoPiiLogged();
  });

  it('forwards to the leads API with a bearer token when configured', async () => {
    const kv = new FakeKV();
    const env: Env = { LEADS_KV: kv, LEADS_API_URL: 'https://leads.example/api', LEADS_API_KEY: 'k' };
    const res = await onRequestPost({ request: req(VALID), env });
    assert.equal(res.status, 200);
    assert.equal(apiCalls.length, 1);
    assert.equal(apiCalls[0]?.auth, 'Bearer k');
    assert.equal(JSON.parse(apiCalls[0]?.body ?? '{}').origem, 'site');
    assert.equal(kv.store.size, 0);
    assertNoPiiLogged();
  });

  it('falls back to KV when the API rejects the payload (e.g. origem enum)', async () => {
    apiStatus = 422;
    const kv = new FakeKV();
    const res = await onRequestPost({
      request: req(VALID),
      env: { LEADS_KV: kv, LEADS_API_URL: 'https://leads.example/api', LEADS_API_KEY: 'k' },
    });
    assert.equal(res.status, 200);
    assert.equal(kv.store.size, 1);
    assert.equal(JSON.parse([...kv.store.values()][0]?.value ?? '{}').fallback, 'api_failed');
    assertNoPiiLogged();
  });

  it('returns 503 when neither API nor KV is available', async () => {
    const res = await onRequestPost({ request: req(VALID), env: {} });
    assert.equal(res.status, 503);
  });

  it('drops honeypot submissions silently', async () => {
    const kv = new FakeKV();
    const res = await onRequestPost({ request: req({ ...VALID, website: 'http://spam' }), env: { LEADS_KV: kv } });
    assert.equal(res.status, 200);
    assert.equal(kv.store.size, 0);
  });

  it('rejects cross-origin, non-JSON, oversized and malformed bodies', async () => {
    assert.equal((await onRequestPost({ request: req(VALID, { origin: 'https://evil.example' }), env: {} })).status, 403);
    assert.equal((await onRequestPost({ request: req('a=b', { type: 'application/x-www-form-urlencoded' }), env: {} })).status, 415);
    assert.equal((await onRequestPost({ request: req({ ...VALID, message: 'x'.repeat(20_000) }), env: {} })).status, 413);
    assert.equal((await onRequestPost({ request: req('{not json'), env: {} })).status, 400);
  });

  it('returns 422 with field names (never values) for invalid input', async () => {
    const res = await onRequestPost({ request: req({ ...VALID, email: 'nope', consent: false }), env: { LEADS_KV: new FakeKV() } });
    assert.equal(res.status, 422);
    assert.deepEqual((await res.json()).fields, ['email', 'consent']);
    assert.ok(!logs.join('\n').includes('nope'));
  });

  it('answers 405 to other methods', () => {
    assert.equal(onRequest().status, 405);
  });
});

describe('isPreviewHost', () => {
  it('accepts only local and *.pages.dev hosts', () => {
    assert.equal(isPreviewHost('localhost'), true);
    assert.equal(isPreviewHost('127.0.0.1'), true);
    assert.equal(isPreviewHost('abc.logikos-site.pages.dev'), true);
    assert.equal(isPreviewHost('logikosvision.com.br'), false);
    assert.equal(isPreviewHost('pages.dev.evil.com'), false);
  });
});

describe('validateLead', () => {
  const now = new Date('2026-10-01T12:00:00Z');
  it('accepts minimal valid input and trims control characters', () => {
    const r = validateLead({ kind: 'partner', lang: 'en', name: ' Ana\u0007 ', company: 'Co', email: 'a@b.co', consent: true }, now);
    assert.ok(r.ok);
    if (r.ok) {
      assert.equal(r.lead.nome, 'Ana');
      assert.deepEqual(r.lead.interesses, []);
      assert.equal(r.lead.recebido_em, '2026-10-01T12:00:00.000Z');
    }
  });
  it('rejects unknown enums, bad phone, oversize fields and missing consent', () => {
    const r = validateLead(
      {
        kind: 'x',
        lang: 'fr',
        name: 'a'.repeat(500),
        company: '',
        email: 'a@b',
        whatsapp: 'abc',
        interests: ['epi', 'hack'],
        consent: 'yes',
      },
      now,
    );
    assert.equal(r.ok, false);
    if (!r.ok) assert.deepEqual(r.errors, ['kind', 'lang', 'name', 'company', 'email', 'whatsapp', 'interests', 'consent']);
  });
  it('ignores a non-path page value', () => {
    const r = validateLead({ ...VALID, page: 'https://evil.example' }, now);
    assert.ok(r.ok && r.lead.pagina === '');
  });
});
