// POST /api/lead — Cloudflare Pages Function.
// Turnstile is verified server-side; then the lead goes to the recognition-leads
// service when LEADS_API_URL/LEADS_API_KEY are set, otherwise (or on failure) to the
// LEADS_KV namespace ("leads-site"). Lead values never reach logs, only event names.

import { validateLead, type Lead, type LeadInput } from '../../src/lib/lead.ts';

interface KV {
  put(key: string, value: string, options?: { metadata?: Record<string, string> }): Promise<void>;
}

export interface Env {
  TURNSTILE_SECRET_KEY?: string;
  LEADS_API_URL?: string;
  LEADS_API_KEY?: string;
  LEADS_KV?: KV;
}

interface Ctx {
  request: Request;
  env: Env;
}

/** Cloudflare's documented always-pass test secret; pairs with the test site key. */
export const TURNSTILE_TEST_SECRET = '1x0000000000000000000000000000000AA';
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const MAX_BODY = 16 * 1024;

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function logEvent(event: string, detail: Record<string, string | number | boolean> = {}): void {
  // Only event names and non-personal facts. Never field values.
  console.log(JSON.stringify({ evt: event, ...detail }));
}

/** The test secret is only acceptable off the production domain (previews and local dev). */
export function isPreviewHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.pages.dev');
}

function turnstileSecret(env: Env, hostname: string): string | undefined {
  if (env.TURNSTILE_SECRET_KEY) return env.TURNSTILE_SECRET_KEY;
  return isPreviewHost(hostname) ? TURNSTILE_TEST_SECRET : undefined;
}

async function verifyTurnstile(token: string, secret: string, ip: string | null): Promise<boolean> {
  const form = new URLSearchParams();
  form.set('secret', secret);
  form.set('response', token);
  if (ip) form.set('remoteip', ip);
  try {
    const res = await fetch(SITEVERIFY, { method: 'POST', body: form });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

async function forwardToApi(lead: Lead, env: Env): Promise<boolean> {
  if (!env.LEADS_API_URL || !env.LEADS_API_KEY) return false;
  try {
    const res = await fetch(env.LEADS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.LEADS_API_KEY}` },
      body: JSON.stringify(lead),
    });
    logEvent('lead.forward', { status: res.status });
    return res.ok;
  } catch {
    logEvent('lead.forward', { status: 0 });
    return false;
  }
}

async function storeInKv(lead: Lead, env: Env, reason: string): Promise<boolean> {
  if (!env.LEADS_KV) return false;
  const key = `lead:${lead.recebido_em}:${crypto.randomUUID()}`;
  await env.LEADS_KV.put(key, JSON.stringify({ ...lead, fallback: reason }), {
    metadata: { tipo: lead.tipo, idioma: lead.idioma, origem: lead.origem },
  });
  logEvent('lead.stored', { sink: 'kv', reason });
  return true;
}

export async function onRequestPost({ request, env }: Ctx): Promise<Response> {
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) {
    logEvent('lead.rejected', { reason: 'origin' });
    return json(403, { ok: false, error: 'origin' });
  }
  if (!(request.headers.get('Content-Type') ?? '').includes('application/json')) {
    return json(415, { ok: false, error: 'content_type' });
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json(413, { ok: false, error: 'too_large' });

  let input: LeadInput;
  try {
    input = JSON.parse(raw) as LeadInput;
  } catch {
    return json(400, { ok: false, error: 'json' });
  }

  // Honeypot filled: pretend success, store nothing.
  if (typeof input.website === 'string' && input.website.trim() !== '') {
    logEvent('lead.dropped', { reason: 'honeypot' });
    return json(200, { ok: true });
  }

  const token = typeof input.turnstileToken === 'string' ? input.turnstileToken.trim() : '';
  if (!token) {
    logEvent('lead.rejected', { reason: 'turnstile_missing' });
    return json(400, { ok: false, error: 'verification' });
  }

  const result = validateLead(input, new Date());
  if (!result.ok) {
    logEvent('lead.rejected', { reason: 'invalid', fields: result.errors.join(',') });
    return json(422, { ok: false, error: 'invalid', fields: result.errors });
  }

  const secret = turnstileSecret(env, new URL(request.url).hostname);
  if (!secret) {
    // Fail closed: a production host without the real secret would accept any token.
    logEvent('lead.rejected', { reason: 'turnstile_unconfigured' });
    return json(503, { ok: false, error: 'unavailable' });
  }
  const verified = await verifyTurnstile(token, secret, request.headers.get('CF-Connecting-IP'));
  if (!verified) {
    logEvent('lead.rejected', { reason: 'turnstile_failed' });
    return json(403, { ok: false, error: 'verification' });
  }

  const lead = result.lead;
  if (await forwardToApi(lead, env)) {
    logEvent('lead.stored', { sink: 'api' });
    return json(200, { ok: true });
  }
  const reason = env.LEADS_API_URL ? 'api_failed' : 'api_not_configured';
  if (await storeInKv(lead, env, reason)) return json(200, { ok: true });

  logEvent('lead.unavailable');
  return json(503, { ok: false, error: 'unavailable' });
}

export function onRequest(): Response {
  return json(405, { ok: false, error: 'method' });
}
