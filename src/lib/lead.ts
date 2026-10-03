// Lead contract shared by the form (client) and the Pages Function (server).
// Pure module: no DOM, no Node, no Workers APIs.

export const LEAD_KINDS = ['contact', 'partner', 'account'] as const;
export type LeadKind = (typeof LEAD_KINDS)[number];

export const LEAD_LANGS = ['pt-br', 'en'] as const;
/** Platform mode asked on the account request; stored in Portuguese like the other fields. */
export const LEAD_MODES = ['edge', 'cloud'] as const;
export type LeadMode = (typeof LEAD_MODES)[number];
export const MAX_CAMERAS = 999;
export type LeadLang = (typeof LEAD_LANGS)[number];

export const LEAD_INTERESTS = ['fire', 'epi', 'ergonomics', 'zones', 'counting', 'twins', 'robotics', 'partnership'] as const;
export type LeadInterest = (typeof LEAD_INTERESTS)[number];

/** Bumped whenever the privacy policy text changes; stored with each consent. */
export const PRIVACY_VERSION = 'provisoria-2026-10';

export const LIMITS = {
  name: 120,
  company: 160,
  role: 120,
  email: 254,
  whatsapp: 32,
  message: 4000,
} as const;

export interface LeadInput {
  kind?: unknown;
  lang?: unknown;
  name?: unknown;
  company?: unknown;
  role?: unknown;
  email?: unknown;
  whatsapp?: unknown;
  interests?: unknown;
  message?: unknown;
  consent?: unknown;
  /** Account requests only. */
  cameras?: unknown;
  mode?: unknown;
  page?: unknown;
  website?: unknown;
  turnstileToken?: unknown;
}

/** Payload sent to recognition-leads (or stored in KV). Field names follow the PT-BR domain. */
export interface Lead {
  origem: 'site';
  tipo: LeadKind;
  idioma: LeadLang;
  nome: string;
  empresa: string;
  cargo: string;
  email: string;
  whatsapp: string;
  interesses: LeadInterest[];
  mensagem: string;
  /** Account requests: how many cameras and which mode; null on the other kinds. */
  cameras: number | null;
  modo: 'edge' | 'nuvem' | null;
  consentimento: { aceito: true; versao_politica: string; em: string };
  pagina: string;
  recebido_em: string;
}

export type LeadField =
  'kind' | 'lang' | 'name' | 'company' | 'role' | 'email' | 'whatsapp' | 'interests' | 'message' | 'consent' | 'cameras' | 'mode';

/** Shared with the form's `pattern` attributes so client and server agree. */
export const EMAIL_PATTERN = '[^\\s@]+@[^\\s@]+\\.[^\\s@]+';
// Valid both as a JS RegExp and as an HTML `pattern` (compiled with the `v` flag).
export const PHONE_PATTERN = '\\+?[\\d\\s\\(\\)\\.\\-]{8,32}';
const EMAIL_RE = new RegExp(`^${EMAIL_PATTERN}$`);
const PHONE_RE = new RegExp(`^${PHONE_PATTERN}$`);

/** Bidi overrides/isolates, line/paragraph separators: never legitimate in a form field. */
const INVISIBLE = new Set([0x2028, 0x2029, 0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2066, 0x2067, 0x2068, 0x2069]);

/** Drops C0/C1 controls, DEL and bidi controls. Multi-line fields keep tab, LF and CR. */
function stripControls(s: string, multiline: boolean): string {
  return [...s]
    .filter((ch) => {
      const c = ch.codePointAt(0) ?? 0;
      if (multiline && (c === 9 || c === 10 || c === 13)) return true;
      return c >= 32 && c !== 127 && !(c >= 0x80 && c <= 0x9f) && !INVISIBLE.has(c);
    })
    .join('');
}

function text(v: unknown, max: number, multiline = false): string | undefined {
  if (v === undefined || v === null) return '';
  if (typeof v !== 'string') return undefined;
  const s = stripControls(v, multiline).trim();
  return s.length > max ? undefined : s;
}

const PAGE_RE = /^\/(?!\/)[\w\-./]{0,199}$/;

function oneOf<T extends string>(v: unknown, allowed: readonly T[]): T | undefined {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;
}

export function validateLead(input: LeadInput, now: Date): { ok: true; lead: Lead } | { ok: false; errors: LeadField[] } {
  const errors: LeadField[] = [];
  const kind = oneOf(input.kind, LEAD_KINDS);
  const lang = oneOf(input.lang, LEAD_LANGS);
  const name = text(input.name, LIMITS.name);
  const company = text(input.company, LIMITS.company);
  const role = text(input.role, LIMITS.role);
  const email = text(input.email, LIMITS.email);
  const whatsapp = text(input.whatsapp, LIMITS.whatsapp);
  const message = text(input.message, LIMITS.message, true);
  const rawInterests: unknown[] = Array.isArray(input.interests) ? input.interests : [];
  const interests = [...new Set(rawInterests.map((i) => oneOf(i, LEAD_INTERESTS)))];

  if (!kind) errors.push('kind');
  if (!lang) errors.push('lang');
  if (!name) errors.push('name');
  if (!company) errors.push('company');
  if (role === undefined) errors.push('role');
  if (!email || !EMAIL_RE.test(email)) errors.push('email');
  if (whatsapp === undefined || (whatsapp !== '' && !PHONE_RE.test(whatsapp))) errors.push('whatsapp');
  const interestsShapeOk = input.interests === undefined || Array.isArray(input.interests);
  if (!interestsShapeOk || interests.includes(undefined) || rawInterests.length > LEAD_INTERESTS.length) {
    errors.push('interests');
  }
  if (message === undefined) errors.push('message');
  if (input.consent !== true) errors.push('consent');
  // Account requests carry two more answers; other kinds must not send them.
  let cameras: number | null = null;
  let mode: LeadMode | undefined;
  if (kind === 'account') {
    const n =
      typeof input.cameras === 'number'
        ? input.cameras
        : typeof input.cameras === 'string' && /^\d{1,3}$/.test(input.cameras.trim())
          ? Number(input.cameras)
          : NaN;
    if (!Number.isInteger(n) || n < 1 || n > MAX_CAMERAS) errors.push('cameras');
    else cameras = n;
    mode = oneOf(input.mode, LEAD_MODES);
    if (!mode) errors.push('mode');
  } else if (input.cameras !== undefined || input.mode !== undefined) {
    errors.push(input.cameras !== undefined ? 'cameras' : 'mode');
  }

  if (
    errors.length > 0 ||
    !kind ||
    !lang ||
    !name ||
    !company ||
    role === undefined ||
    !email ||
    whatsapp === undefined ||
    message === undefined
  ) {
    return { ok: false, errors };
  }

  const page = typeof input.page === 'string' && PAGE_RE.test(input.page) ? input.page : '';
  const at = now.toISOString();
  return {
    ok: true,
    lead: {
      origem: 'site',
      tipo: kind,
      idioma: lang,
      nome: name,
      empresa: company,
      cargo: role,
      email,
      whatsapp,
      interesses: interests.filter((i): i is LeadInterest => i !== undefined),
      mensagem: message,
      cameras,
      modo: mode === 'edge' ? 'edge' : mode === 'cloud' ? 'nuvem' : null,
      consentimento: { aceito: true, versao_politica: PRIVACY_VERSION, em: at },
      pagina: page,
      recebido_em: at,
    },
  };
}
