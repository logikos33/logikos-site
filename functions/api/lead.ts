// POST /api/lead — Cloudflare Pages Function.
// Turnstile is verified server-side; then the lead goes to the recognition-leads
// service when LEADS_API_URL/LEADS_API_KEY are set, otherwise (or on failure) to the
// LEADS_KV namespace ("leads-site"; previews bind "leads-site-preview").
// Lead values never reach logs, only event names and non-personal facts.

import { validateLead, type Lead, type LeadInput, type LeadKind } from '../../src/lib/lead.ts';

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

/**
 * Cloudflare's documented always-pass test secret. It is used only for local development
 * (localhost); deployed previews receive it explicitly through wrangler.toml [env.preview.vars],
 * and production must have the real TURNSTILE_SECRET_KEY or the endpoint fails closed.
 */
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

/** Requests that can only come from the developer's own machine. */
export function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function turnstileSecret(env: Env, hostname: string): string | undefined {
  if (env.TURNSTILE_SECRET_KEY) return env.TURNSTILE_SECRET_KEY;
  return isLocalHost(hostname) ? TURNSTILE_TEST_SECRET : undefined;
}

export function turnstileAction(kind: LeadKind): string {
  return `lead-${kind}`;
}

interface Siteverify {
  success?: boolean;
  hostname?: string;
  action?: string;
}

async function verifyTurnstile(
  token: string,
  secret: string,
  ip: string | null,
  expect: { hostname: string; action: string },
): Promise<boolean> {
  const form = new URLSearchParams();
  form.set('secret', secret);
  form.set('response', token);
  form.set('idempotency_key', crypto.randomUUID());
  if (ip) form.set('remoteip', ip);
  try {
    const res = await fetch(SITEVERIFY, { method: 'POST', body: form });
    if (!res.ok) return false;
    const data = (await res.json()) as Siteverify;
    if (data.success !== true) return false;
    // Test keys answer with placeholder hostname/action; real keys must match this request.
    if (secret === TURNSTILE_TEST_SECRET) return true;
    return data.hostname === expect.hostname && data.action === expect.action;
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
  try {
    await env.LEADS_KV.put(key, JSON.stringify({ ...lead, fallback: reason }), {
      metadata: { tipo: lead.tipo, idioma: lead.idioma, origem: lead.origem },
    });
  } catch {
    logEvent('lead.store_failed', { sink: 'kv' });
    return false;
  }
  logEvent('lead.stored', { sink: 'kv', reason });
  return true;
}

export async function onRequestPost({ request, env }: Ctx): Promise<Response> {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');
  if (origin && origin !== url.origin) {
    logEvent('lead.rejected', { reason: 'origin' });
    return json(403, { ok: false, error: 'origin' });
  }
  if (!(request.headers.get('Content-Type') ?? '').includes('application/json')) {
    return json(415, { ok: false, error: 'content_type' });
  }
  const declared = Number(request.headers.get('Content-Length') ?? '0');
  if (declared > MAX_BODY) return json(413, { ok: false, error: 'too_large' });
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY) return json(413, { ok: false, error: 'too_large' });

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return json(400, { ok: false, error: 'json' });
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return json(400, { ok: false, error: 'json' });
  }
  const input = parsed as LeadInput;

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

  const secret = turnstileSecret(env, url.hostname);
  if (!secret) {
    // Fail closed: without the real secret any token would pass.
    logEvent('lead.rejected', { reason: 'turnstile_unconfigured' });
    return json(503, { ok: false, error: 'unavailable' });
  }
  const lead = result.lead;
  const verified = await verifyTurnstile(token, secret, request.headers.get('CF-Connecting-IP'), {
    hostname: url.hostname,
    action: turnstileAction(lead.tipo),
  });
  if (!verified) {
    logEvent('lead.rejected', { reason: 'turnstile_failed' });
    return json(403, { ok: false, error: 'verification' });
  }

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
