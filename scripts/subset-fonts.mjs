// Subsets the three variable fonts to the characters the site can show (both dictionaries,
// the HUD clips, the brand page's Greek, Latin-1 and the punctuation we use) and to the
// weight ranges in use, into src/fonts/ (Vite hashes them into /_astro/, which is immutable-cached).
// Committed output: the build has no font step.
// Run: node scripts/subset-fonts.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import subsetFont from 'subset-font';

const require = createRequire(import.meta.url);

// Every printable ASCII + Latin-1 letter, plus what the dictionaries, clips and templates use.
const chars = new Set();
for (let c = 0x20; c <= 0x7e; c++) chars.add(String.fromCharCode(c));
for (let c = 0xa0; c <= 0xff; c++) chars.add(String.fromCharCode(c));
for (const f of ['src/i18n/pt-br.json', 'src/i18n/en.json']) for (const c of readFileSync(f, 'utf8')) chars.add(c);
for (const f of readdirSync('src/data/hud')) for (const c of readFileSync(`src/data/hud/${f}`, 'utf8')) chars.add(c);
for (const c of 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ–—‘’“”…•·→←↑↓×≈≤≥≠€™') chars.add(c);
const text = [...chars].filter((c) => c.charCodeAt(0) >= 0x20 && c !== '\u007f').join('');

const FONTS = [
  ['space-grotesk', '@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2', { wght: { min: 400, max: 700 } }],
  ['inter', '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', { wght: { min: 400, max: 700 } }],
  ['jetbrains-mono', '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2', { wght: { min: 400, max: 500 } }],
];

for (const [name, spec, variationAxes] of FONTS) {
  const src = readFileSync(require.resolve(spec));
  const out = await subsetFont(src, text, { targetFormat: 'woff2', variationAxes });
  writeFileSync(`src/fonts/${name}.woff2`, out);
  console.log(`${name}: ${src.length} → ${out.length} bytes (${Math.round((100 * out.length) / src.length)} %), ${text.length} chars`);
}
