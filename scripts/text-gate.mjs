// Forbidden-text gate over the BUILT site (dist/). Fails if any served file contains a
// banned claim. Matching is case- and accent-insensitive on whole words.
// Commercial rule + LGPD / PL 2.338: no client names, installed base, camera counts,
// prices, person identification, AGPL tooling, or filler text.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const ROOT = process.argv[2] ?? 'dist';

/** [label, regex] — regexes run on accent-stripped, lower-cased text. */
const RULES = [
  ['RVB', /\brvb\b/],
  ['28 câmeras', /\b28\s+cameras?\b/],
  ['câmeras em operação', /\bcameras?\s+em\s+operacao\b/],
  ['identificação de pessoas', /\bidentificacao\s+de\s+pessoas?\b/],
  ['identificação facial', /\bidentificacao\s+facial\b/],
  ['Ultralytics', /\bultralytics\b/],
  ['R$', /r\$/],
  ['lorem', /\blorem\b/],
  // Same pattern, found in the inventory: client and legacy brand names must never ship.
  ['Brandschutz', /\bbrandschutz\b/],
  ['TBJ', /\btbj\b/],
  ['CATH', /\bcath\b/],
  ['Roccatextil', /\broccatextil\b/],
  ['EPI Monitor', /\bepi\s*monitor\b|\bepimonitor\b/],
  ['YOLOv8', /\byolo\s*v?8\b/],
];

const TEXT_EXT = new Set(['.html', '.xml', '.json', '.svg', '.txt', '.css', '.js', '.webmanifest']);

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

function normalize(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Remove machine-generated noise that can contain arbitrary letter runs (hashes, base64). */
function scrub(content, ext) {
  let s = content;
  if (ext === '.html') {
    s = s.replace(/<meta[^>]+http-equiv="content-security-policy"[^>]*>/gi, '');
    s = s.replace(/\s(?:integrity|nonce)="[^"]*"/gi, '');
  }
  return s.replace(/data:[a-z/+.-]+;base64,[A-Za-z0-9+/=]+/g, '');
}

const hits = [];
let files = 0;
for (const file of walk(ROOT)) {
  const ext = extname(file);
  if (!TEXT_EXT.has(ext)) continue;
  files++;
  const text = normalize(scrub(readFileSync(file, 'utf8'), ext));
  for (const [label, re] of RULES) {
    // In minified JS, `R$` can be an identifier; there it only counts before a number.
    const rule = ext === '.js' && label === 'R$' ? /r\$\s?\d/ : re;
    const m = rule.exec(text);
    if (m) hits.push(`${file}: "${label}" near …${text.slice(Math.max(0, m.index - 40), m.index + 40).replace(/\s+/g, ' ')}…`);
  }
}

console.log(`text-gate: scanned ${files} file(s) in ${ROOT}/ against ${RULES.length} rule(s).`);
if (hits.length) {
  console.error(`text-gate: FAIL\n${hits.join('\n')}`);
  process.exit(1);
}
console.log('text-gate: PASS');
