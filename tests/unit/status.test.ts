// /api/status: HEAD probes with a timeout, "up" only on 2xx/3xx, cached through the Cache API.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { onRequestGet, probe, status } from '../../functions/api/status.ts';

const fetcher = (map: Record<string, number | 'throw' | 'hang'>): typeof fetch =>
  (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const v = map[url];
    assert.equal(init?.method, 'HEAD');
    if (v === 'throw') throw new TypeError('network');
    if (v === 'hang')
      return new Promise<Response>((_, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted'))));
    return new Response(null, { status: v ?? 404 });
  }) as typeof fetch;

describe('probe', () => {
  it('2xx and 3xx are up; 4xx/5xx, network errors are down', async () => {
    assert.equal(await probe('https://a/', fetcher({ 'https://a/': 200 })), 'up');
    assert.equal(await probe('https://a/', fetcher({ 'https://a/': 301 })), 'up');
    assert.equal(await probe('https://a/', fetcher({ 'https://a/': 503 })), 'down');
    assert.equal(await probe('https://a/', fetcher({ 'https://a/': 'throw' })), 'down');
  });
});

describe('status', () => {
  it('reports both demos with a timestamp', async () => {
    const s = await status(
      fetcher({ 'https://recognition-demo-evento-production.up.railway.app/': 200, 'https://fire-demo-production.up.railway.app/': 502 }),
      new Date('2026-10-03T12:00:00Z'),
    );
    assert.deepEqual(s, { epi: 'up', fire: 'down', checked_at: '2026-10-03T12:00:00.000Z' });
  });
});

describe('onRequestGet', () => {
  it('serves from the cache when present and stores a fresh answer otherwise', async () => {
    const store = new Map<string, Response>();
    const cache = {
      match: async (req: Request) => store.get(req.url),
      put: async (req: Request, res: Response) => {
        store.set(req.url, res);
      },
    };
    (globalThis as { caches?: unknown }).caches = { default: cache };
    const pending: Promise<unknown>[] = [];
    const ctx = { request: new Request('https://site.example/api/status'), waitUntil: (p: Promise<unknown>) => pending.push(p) };
    const first = await onRequestGet(ctx);
    assert.equal(first.headers.get('Cache-Control'), 'public, max-age=60');
    await Promise.all(pending);
    assert.equal(store.size, 1);
    const body = (await first.json()) as { epi: string; fire: string };
    assert.ok(['up', 'down'].includes(body.epi) && ['up', 'down'].includes(body.fire));
    const second = await onRequestGet(ctx);
    assert.strictEqual(second, store.get('https://site.example/api/status'));
    delete (globalThis as { caches?: unknown }).caches;
  });
});
