// i18n gate over the BUILT site: every human-visible text node and human-facing attribute in
// dist/**/*.html must be made of dictionary strings (src/i18n/*.json) plus data (numbers,
// e-mails, CNPJ, punctuation). Catches UI text generated outside .astro templates (e.g. .ts).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.argv[2] ?? 'dist';
const dicts = ['src/i18n/pt-br.json', 'src/i18n/en.json'].map((f) => JSON.parse(readFileSync(f, 'utf8')));

function strings(node, out) {
  if (typeof node === 'string') out.push(node);
  else if (Array.isArray(node)) node.forEach((v) => strings(v, out));
  else if (node && typeof node === 'object') Object.values(node).forEach((v) => strings(v, out));
  return out;
}

// Templates like "Pelo e-mail {email}." contribute their literal fragments.
const fragments = new Set();
for (const d of dicts) {
  for (const s of strings(d, [])) {
    for (const part of s.split(/\{\w+\}/)) if (/[A-Za-zÀ-ÿΑ-ω]/.test(part)) fragments.add(part.trim().toLocaleLowerCase('pt-BR'));
  }
}
const escapeRe = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Longest first; fragments only match whole words, so "en" never eats "Enviando".
const ordered = [...fragments]
  .sort((a, b) => b.length - a.length)
  .map((f) => {
    const word = /^[\p{L}\p{N}]/u.test(f) ? '(?<![\\p{L}\\p{N}])' : '';
    const end = /[\p{L}\p{N}]$/u.test(f) ? '(?![\\p{L}\\p{N}])' : '';
    return new RegExp(`${word}${escapeRe(f)}${end}`, 'gu');
  });

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&nbsp;': ' ' };
const decode = (s) =>
  s.replace(/&(?:amp|lt|gt|quot|apos|nbsp|#39);/g, (m) => ENTITIES[m] ?? m).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));

const LETTERS = /[A-Za-zÀ-ÿΑ-ω]{2,}/;
function leftover(text) {
  let t = decode(text).replace(/\s+/g, ' ').trim().toLocaleLowerCase('pt-BR');
  if (!t) return '';
  t = t.replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, ' '); // e-mail addresses (data)
  t = t.replace(/(^|\s)--[a-z0-9-]+(?=\s|$)/g, ' '); // CSS token names shown on /_marca (code identifiers)
  for (const re of ordered) t = t.replace(re, ' ');
  return LETTERS.test(t) ? t.trim() : '';
}

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const problems = [];
let nodes = 0;
for (const file of walk(ROOT).filter((f) => f.endsWith('.html'))) {
  const raw = readFileSync(file, 'utf8');
  // Strings that scripts render (data-label-*, data-msg-*, data-err-*, the HUD label JSON)
  // and what search engines/social cards show (meta description, og:*).
  const scripted = [
    ...[...raw.matchAll(/\sdata-(?:label|msg|err)-[\w-]+="([^"]*)"/g)].map((m) => m[1] ?? ''),
    ...[...raw.matchAll(/\sdata-labels="([^"]*)"/g)].flatMap((m) => strings(JSON.parse(decode(m[1] ?? '{}')), [])),
    ...[...raw.matchAll(/<meta\s+(?:name="description"|property="og:(?:title|description|image:alt|site_name)")\s+content="([^"]*)"/g)].map(
      (m) => m[1] ?? '',
    ),
  ];
  for (const value of scripted) {
    nodes++;
    const rest = leftover(value);
    if (rest) problems.push(`${file}: scripted/meta string "${value.slice(0, 80)}" → "${rest}"`);
  }
  const html = raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<head>[\s\S]*?<title>/i, '<head><title>');
  for (const m of html.matchAll(/\s(?:aria-label|alt|title|placeholder)="([^"]*)"/g)) {
    nodes++;
    const rest = leftover(m[1] ?? '');
    if (rest) problems.push(`${file}: attribute ${m[0].trim()} → "${rest}"`);
  }
  for (const m of html.replace(/<[^>]+>/g, '\u0000').split('\u0000')) {
    if (!m.trim()) continue;
    nodes++;
    const rest = leftover(m);
    if (rest) problems.push(`${file}: text "${m.trim().slice(0, 80)}" → "${rest}"`);
  }
}

if (problems.length) {
  console.error(`i18n-dist-gate: FAIL (${problems.length})\n${problems.join('\n')}`);
  process.exit(1);
}
console.log(`i18n-dist-gate: PASS — ${nodes} text nodes/attributes in ${ROOT}/ all come from the dictionaries.`);
