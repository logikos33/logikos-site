// GET /api/status — live state of the two public demos, probed from the server (the browser
// never talks to the demo hosts, so connect-src stays 'self'). Cached 60 s in the Cache API.
// Neither demo exposes a health route: a HEAD on the document root that answers 2xx/3xx is "up".

/** Same URLs as src/config/links.ts (functions cannot import from src/ without a bundler step). */
export const PROBES = {
  epi: 'https://recognition-demo-evento-production.up.railway.app/',
  fire: 'https://fire-demo-production.up.railway.app/',
} as const;
export type DemoKey = keyof typeof PROBES;
export type DemoState = 'up' | 'down';
export interface Status {
  epi: DemoState;
  fire: DemoState;
  checked_at: string;
}

const TTL_S = 60;
const PROBE_TIMEOUT_MS = 5000;

interface Ctx {
  request: Request;
  waitUntil(promise: Promise<unknown>): void;
}

export async function probe(url: string, fetcher: typeof fetch = fetch): Promise<DemoState> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetcher(url, { method: 'HEAD', redirect: 'manual', signal: ctrl.signal });
    return res.status >= 200 && res.status < 400 ? 'up' : 'down';
  } catch {
    return 'down';
  } finally {
    clearTimeout(timer);
  }
}

export async function status(fetcher: typeof fetch = fetch, now = new Date()): Promise<Status> {
  const [epi, fire] = await Promise.all([probe(PROBES.epi, fetcher), probe(PROBES.fire, fetcher)]);
  return { epi, fire, checked_at: now.toISOString() };
}

function json(body: Status): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${TTL_S}` },
  });
}

export async function onRequestGet({ request, waitUntil }: Ctx): Promise<Response> {
  const cache = (globalThis as unknown as { caches?: { default: Cache } }).caches?.default;
  const key = new Request(new URL('/api/status', request.url).href, { method: 'GET' });
  if (cache) {
    const hit = await cache.match(key);
    if (hit) return hit;
  }
  const res = json(await status());
  if (cache) waitUntil(cache.put(key, res.clone()));
  return res;
}

export function onRequest(): Response {
  return new Response(JSON.stringify({ ok: false, error: 'method' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
}
