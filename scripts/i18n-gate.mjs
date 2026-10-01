// i18n gate:
//  1. pt-br.json and en.json have exactly the same keys/shape and no empty strings;
//  2. every number in the dictionaries is documented in src/i18n/numbers.allow.json;
//  3. no UI text is hard-coded in .astro templates (text nodes or human-facing attributes).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const problems = [];
const pt = JSON.parse(readFileSync('src/i18n/pt-br.json', 'utf8'));
const en = JSON.parse(readFileSync('src/i18n/en.json', 'utf8'));
/** key path → numbers documented for that key only. */
const allow = JSON.parse(readFileSync('src/i18n/numbers.allow.json', 'utf8')).allow;

function shape(node, path, out) {
  if (Array.isArray(node)) {
    out.set(path, `array:${node.length}`);
    node.forEach((v, i) => shape(v, `${path}[${i}]`, out));
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) shape(v, path ? `${path}.${k}` : k, out);
  } else {
    out.set(path, typeof node);
  }
  return out;
}

function strings(node, path, out = []) {
  if (typeof node === 'string') out.push([path, node]);
  else if (Array.isArray(node)) node.forEach((v, i) => strings(v, `${path}[${i}]`, out));
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) strings(v, path ? `${path}.${k}` : k, out);
  return out;
}

// 1. Parity
const a = shape(pt, '', new Map());
const b = shape(en, '', new Map());
for (const [k, v] of a) if (b.get(k) !== v) problems.push(`parity: en.json ${k} is ${b.get(k) ?? 'missing'}, pt-br.json has ${v}`);
for (const k of b.keys()) if (!a.has(k)) problems.push(`parity: en.json has extra key ${k}`);

// 2. Empty strings and undocumented numbers
for (const [file, dictObj] of [
  ['pt-br.json', pt],
  ['en.json', en],
]) {
  for (const [path, value] of strings(dictObj, '')) {
    if (value.trim() === '') problems.push(`empty: ${file} ${path}`);
    for (const n of value.match(/\d+(?:[.,]\d+)*/g) ?? []) {
      if (!allow[path]?.values.includes(n))
        problems.push(`number: ${file} ${path} contains "${n}" — not documented for this key in numbers.allow.json`);
    }
  }
}

// 3. Hard-coded text in .astro templates
function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

/** Removes `{ ... }` expressions, respecting quotes, template literals and nesting. */
function stripExpressions(src) {
  let out = '';
  let depth = 0;
  let quote = '';
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (depth > 0) {
      if (quote) {
        if (c === '\\') i++;
        else if (c === quote) quote = '';
      } else if (c === '"' || c === "'" || c === '`') quote = c;
      else if (c === '{') depth++;
      else if (c === '}') depth--;
      continue;
    }
    if (c === '{') {
      depth = 1;
      continue;
    }
    out += c;
  }
  return out;
}

// Attributes people read or hear, including data-* strings that scripts render as UI text.
const HUMAN_ATTRS = /\s(?:aria-label|alt|title|placeholder|aria-description|label|data-(?:label|msg|err)-[\w-]+)="([^"]*)"/g;
const LETTERS = /[A-Za-zÀ-ÿ]{2,}/;

for (const file of walk('src').filter((f) => f.endsWith('.astro'))) {
  let src = readFileSync(file, 'utf8');
  src = src.replace(/^---[\s\S]*?\n---/, '');
  src = src
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  src = stripExpressions(src);
  for (const m of src.matchAll(HUMAN_ATTRS)) {
    if (LETTERS.test(m[1] ?? '')) problems.push(`hard-coded attribute in ${file}: ${m[0].trim()}`);
  }
  const textOnly = src.replace(/<[^>]*>/g, '\n');
  for (const line of textOnly.split('\n')) {
    const t = line.trim();
    if (t && LETTERS.test(t)) problems.push(`hard-coded text in ${file}: "${t.slice(0, 80)}"`);
  }
}

if (problems.length) {
  console.error(`i18n-gate: FAIL (${problems.length})\n${problems.join('\n')}`);
  process.exit(1);
}
console.log(`i18n-gate: PASS — ${a.size} keys in parity, numbers documented, no hard-coded UI text.`);
