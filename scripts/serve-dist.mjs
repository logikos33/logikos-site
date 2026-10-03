// Minimal static server over dist/ that resolves Astro's `format: preserve` output the way
// Cloudflare Pages does (/recognition → recognition.html, /en/ → en/index.html). Used for local
// Lighthouse and screenshot runs where wrangler's cold start makes the first requests flaky.
// Usage: node scripts/serve-dist.mjs [port]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';

const PORT = Number(process.argv[2] ?? 8787);
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};

async function file(p) {
  try {
    return (await stat(p)).isFile() ? p : undefined;
  } catch {
    return undefined;
  }
}

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
  // The Pages Function is not here; answer "unknown" so the demo chips stay "verificando" and
  // no 404 reaches the console (Lighthouse best-practices counts console errors).
  if (path === '/api/status') {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ epi: 'unknown', fire: 'unknown', checked_at: new Date().toISOString() }));
    return;
  }
  const candidates = path.endsWith('/') ? [`${path}index.html`] : [path, `${path}.html`, `${path}/index.html`];
  for (const c of candidates) {
    const hit = await file(join('dist', c));
    if (hit) {
      res.setHeader('content-type', MIME[extname(hit)] ?? 'application/octet-stream');
      res.end(await readFile(hit));
      return;
    }
  }
  res.statusCode = 404;
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.end(await readFile('dist/404.html').catch(() => 'not found'));
}).listen(PORT, '127.0.0.1', () => console.log(`serving dist/ on http://127.0.0.1:${PORT}`));
