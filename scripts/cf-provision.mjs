// Idempotent Cloudflare provisioning for CI deploys (REST API, no dashboard clicks):
//  - Pages project "logikos-site" (production branch: main) — created if missing;
//  - KV namespaces "leads-site" (production) and "leads-site-preview" (previews) — created if
//    missing; their ids are written into wrangler.toml in the CI workspace (the committed file
//    keeps the placeholders).
// ⛔ Never touches custom domains, DNS or any other project. Reads CLOUDFLARE_API_TOKEN and
// CLOUDFLARE_ACCOUNT_ID from env; prints ids and names only, never the token.
import { readFileSync, writeFileSync } from 'node:fs';

const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID;
const PROJECT = process.env.CF_PAGES_PROJECT ?? 'logikos-site';
const KV = [
  { title: 'leads-site', placeholder: '__LEADS_KV_ID__' },
  { title: 'leads-site-preview', placeholder: '__LEADS_KV_PREVIEW_ID__' },
];

if (!TOKEN || !ACCOUNT) {
  console.error('cf-provision: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are required.');
  process.exit(2);
}

const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}`;

async function cf(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function ensureProject() {
  const got = await cf(`/pages/projects/${PROJECT}`);
  if (got.status === 200) {
    console.log(`cf-provision: Pages project "${PROJECT}" exists.`);
    return;
  }
  if (got.status !== 404) throw new Error(`Pages project lookup failed: HTTP ${got.status} ${JSON.stringify(got.body.errors ?? [])}`);
  const created = await cf('/pages/projects', { method: 'POST', body: JSON.stringify({ name: PROJECT, production_branch: 'main' }) });
  if (!created.body.success) throw new Error(`Pages project create failed: ${JSON.stringify(created.body.errors ?? [])}`);
  console.log(`cf-provision: Pages project "${PROJECT}" created (subdomain ${created.body.result?.subdomain ?? '?'}).`);
}

async function ensureKv(title) {
  for (let page = 1; page < 20; page++) {
    const list = await cf(`/storage/kv/namespaces?per_page=100&page=${page}`);
    if (!list.body.success) throw new Error(`KV list failed: ${JSON.stringify(list.body.errors ?? [])}`);
    const hit = list.body.result.find((ns) => ns.title === title);
    if (hit) {
      console.log(`cf-provision: KV namespace "${title}" exists (${hit.id}).`);
      return hit.id;
    }
    if (list.body.result.length < 100) break;
  }
  const created = await cf('/storage/kv/namespaces', { method: 'POST', body: JSON.stringify({ title }) });
  if (!created.body.success) throw new Error(`KV create failed: ${JSON.stringify(created.body.errors ?? [])}`);
  console.log(`cf-provision: KV namespace "${title}" created (${created.body.result.id}).`);
  return created.body.result.id;
}

await ensureProject();
let toml = readFileSync('wrangler.toml', 'utf8');
for (const { title, placeholder } of KV) {
  const id = await ensureKv(title);
  if (!toml.includes(placeholder) && !toml.includes(id))
    throw new Error(`wrangler.toml has neither ${placeholder} nor the id of "${title}".`);
  toml = toml.replace(placeholder, id);
}
writeFileSync('wrangler.toml', toml);
console.log('cf-provision: wrangler.toml bound LEADS_KV (production and preview) for this deploy.');
