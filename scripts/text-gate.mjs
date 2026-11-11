// Forbidden-text gate over the BUILT site (dist/). Fails if any served file contains a
// banned claim. Matching is case- and accent-insensitive on whole words.
// Commercial rule + LGPD / PL 2.338: no client names, installed base, camera counts,
// prices, person identification, AGPL tooling, or filler text.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const ROOT = process.argv[2] ?? 'dist';

/** [label, regex] — regexes run on accent-stripped, lower-cased text. */
const RULES = [
  ['RVB', /\brvb\b/],
  ['28 câmeras', /\b28\s+cameras?\b/],
  ['câmeras em operação', /\bcameras?\s+em\s+operacao\b/],
  ['identificação de pessoas', /\bidentificacao\s+de\s+pessoas?\b/],
  ['identificação facial', /\bidentificacao\s+facial\b/],
  ['reconhecimento facial', /\breconhecimento\s+facial\b/],
  ['base instalada', /\bbase\s+instalada\b/],
  // English equivalents (EN is own writing, the same commercial/LGPD rules apply).
  ['person/facial identification', /\b(?:person|people|facial|face)\s+identification\b/],
  ['facial recognition', /\bfac(?:e|ial)\s+recognition\b/],
  ['cameras in operation', /\bcameras?\s+in\s+operation\b/],
  ['installed base', /\binstalled\s+base\b/],
  ['Ultralytics', /\bultralytics\b/],
  ['R$', /r\$/],
  ['lorem', /\blorem\b/],
  // Unfilled template placeholders must never ship.
  ['{{ placeholder', /\{\{/],
  // Same pattern, found in the inventory: client and legacy brand names must never ship.
  ['Brandschutz', /\bbrandschutz\b/],
  ['TBJ', /\btbj\b/],
  ['CATH', /\bcath\b/],
  ['Roccatextil', /\broccatextil\b/],
  ['EPI Monitor', /\bepi\s*monitor\b|\bepimonitor\b/],
  ['YOLOv8', /\byolo\s*v?8\b/],
  // Feedback 11/11 (item 6): no model name, architecture or hardware on any page — the site says
  // "modelo proprietário Logikos" and "processamento na nuvem ou na planta".
  ['YOLO / YOLOX', /\byolo\w*/],
  ['RT-DETR', /\brt-?detr\b/],
  ['FireSet', /\bfireset\b/],
  ['NVIDIA', /\bnvidia\b/],
  ['Jetson', /\bjetson\b/],
  ['TensorRT / DeepStream / ONNX', /\b(?:tensorrt|deepstream|onnx)\b/],
  ['nome de placa', /\b(?:orin|xavier|raspberry\s*pi|hailo|coral\s+tpu)\b/],
  ['edge (como nome técnico)', /\bedge\s+(?:computing|device|ai)\b|\bna\s+borda\b/],
  // Feedback 11/11, item 25c-d: no technical notes for the public, and the licence is monthly /
  // annual / biennial everywhere — never "24 months".
  [
    'detalhe técnico das demos',
    /\bnada e enviado\b|\bnothing is sent\b|\brode o modelo\b|\brun the model\b|\broda no seu aparelho\b|\bruns on your device\b|\bdemos abertas\b|\bopen demos\b|\bdemo generica\b|\bgeneric detection demo\b|\balarme falso medida\b|\bfalse-alarm rate\b/,
  ],
  ['licença de 24 meses', /\b24\s*meses\b|\b24-month\b/],
  // Round 5 (a): no "stock footage / real detection over…" captions anywhere.
  ['legenda de vídeo de banco', /\bvideos? de banco\b|\bstock footage\b|\bdeteccao real\b|\breal detection\b/],
];

// Partner mentions approved by Vitor for the home only (decision 0027): the partner strip and the
// Fireshow card. Exact (normalized) phrases, removed before the rules run; anywhere else, or in any
// other wording, the names still fail.
const APPROVED = {
  'index.html': [
    '/media/parceiros/l-brandschutz.webp',
    '/media/parceiros/l-cath-v2.webp',
    'alt="brandschutz"',
    'alt="cath projetos e seguranca"',
    'estande da parceira brandschutz',
    'booth of our partner brandschutz',
  ],
};
// The CRM's intake host (src/config/links.ts CRM_LEAD_URL), on any page: a machine address, never
// copy. Only this exact URL is allowed; the name in text still fails.
const EVERYWHERE = ['https://brandschutz.logikosvision.com.br/api/lead', 'https://brandschutz.logikosvision.com.br'];
const approvedFor = (file) => [...EVERYWHERE, ...(/^(?:en\/)?index\.html$/.test(relative(ROOT, file)) ? APPROVED['index.html'] : [])];

const TEXT_EXT = new Set(['.html', '.xml', '.json', '.svg', '.txt', '.css', '.js', '.webmanifest']);

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** Decodes entities, folds NBSP and other spaces, strips accents, lower-cases. */
function normalize(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, e) => ENTITIES[e])
    .replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
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
  let text = normalize(scrub(readFileSync(file, 'utf8'), ext));
  for (const phrase of approvedFor(file)) text = text.split(phrase).join(' ');
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
