// Idempotent Cloudflare provisioning for CI deploys (REST API, no dashboard clicks):
//  - Pages project "logikos-site" (production branch: main) — created if missing;
//  - KV namespace "leads-site" — created if missing; its id is written into wrangler.toml
//    in the CI workspace (the committed file keeps the placeholder).
// ⛔ Never touches custom domains, DNS or any other project. Reads CLOUDFLARE_API_TOKEN and
// CLOUDFLARE_ACCOUNT_ID from env; prints ids and names only, never the token.
import { readFileSync, writeFileSync } from 'node:fs';

const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID;
const PROJECT = process.env.CF_PAGES_PROJECT ?? 'logikos-site';
const KV_TITLE = process.env.CF_KV_TITLE ?? 'leads-site';
const PLACEHOLDER = '__LEADS_KV_ID__';

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

async function ensureKv() {
  for (let page = 1; page < 20; page++) {
    const list = await cf(`/storage/kv/namespaces?per_page=100&page=${page}`);
    if (!list.body.success) throw new Error(`KV list failed: ${JSON.stringify(list.body.errors ?? [])}`);
    const hit = list.body.result.find((ns) => ns.title === KV_TITLE);
    if (hit) {
      console.log(`cf-provision: KV namespace "${KV_TITLE}" exists (${hit.id}).`);
      return hit.id;
    }
    if (list.body.result.length < 100) break;
  }
  const created = await cf('/storage/kv/namespaces', { method: 'POST', body: JSON.stringify({ title: KV_TITLE }) });
  if (!created.body.success) throw new Error(`KV create failed: ${JSON.stringify(created.body.errors ?? [])}`);
  console.log(`cf-provision: KV namespace "${KV_TITLE}" created (${created.body.result.id}).`);
  return created.body.result.id;
}

await ensureProject();
const kvId = await ensureKv();
const toml = readFileSync('wrangler.toml', 'utf8');
if (!toml.includes(PLACEHOLDER) && !toml.includes(kvId)) throw new Error('wrangler.toml has neither the placeholder nor the KV id.');
writeFileSync('wrangler.toml', toml.replace(PLACEHOLDER, kvId));
console.log('cf-provision: wrangler.toml bound LEADS_KV for this deploy.');
