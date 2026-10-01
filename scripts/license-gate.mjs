// License gate. Two layers:
//  1. SERVED — every package whose bytes reach the browser or the edge must use a license
//     from the fixed allowlist. "Served" = production `dependencies` (transitive) + every
//     node_modules package found in the built client output (Vite plugin
//     scripts/lib/served-packages.ts → .license/served-packages.json) + every bare import
//     reachable from the Pages Functions in functions/.
//  2. WHOLE TREE — no (A)GPL/LGPL/SSPL/EUPL anywhere, dev tooling included, except entries
//     documented in scripts/license-exceptions.json (dev-only, never served).
// Exit 1 on any violation. Run after `astro build`.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const ALLOW = new Set(['MIT', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', 'ISC', '0BSD', 'CC0-1.0', 'OFL-1.1', 'MPL-2.0']);
const DENY = /\b(A?GPL|LGPL|SSPL|EUPL|CC-BY-NC|Commons-Clause|BUSL)/i;

function licensesJson(extra) {
  const out = execFileSync('pnpm', ['licenses', 'list', '--json', ...extra], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  /** @type {Record<string, {name: string, versions: string[]}[]>} */
  const byLicense = JSON.parse(out);
  const pkgs = new Map();
  for (const [license, list] of Object.entries(byLicense)) {
    for (const p of list) pkgs.set(p.name, license);
  }
  return pkgs;
}

/** SPDX expression is allowed if every OR-branch... at least one OR-alternative is fully allowed. */
function allowed(expr) {
  const clean = expr.replace(/[()]/g, ' ').trim();
  return clean.split(/\s+OR\s+/i).some((alt) => alt.split(/\s+AND\s+/i).every((id) => ALLOW.has(id.trim())));
}

const problems = [];
const prod = licensesJson(['--prod']);
const all = licensesJson([]);

const servedFile = '.license/served-packages.json';
if (!existsSync(servedFile)) {
  console.error(`license-gate: ${servedFile} missing — run \`pnpm build\` first.`);
  process.exit(2);
}
/** @type {string[]} */
const bundled = JSON.parse(readFileSync(servedFile, 'utf8'));

/** Bare (npm) imports reachable from functions/, following relative imports. */
function functionImports() {
  const seen = new Set();
  const pkgs = new Set();
  const walk = (dir) =>
    readdirSync(dir).flatMap((n) => {
      const p = join(dir, n);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });
  const queue = existsSync('functions') ? walk('functions').filter((f) => /\.[cm]?[jt]s$/.test(f)) : [];
  while (queue.length) {
    const file = resolve(queue.pop());
    if (seen.has(file) || !existsSync(file)) continue;
    seen.add(file);
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(/(?:import|export)[^'"]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)) {
      const spec = m[1] ?? m[2] ?? '';
      if (spec.startsWith('.')) queue.push(resolve(dirname(file), spec));
      else if (!spec.startsWith('node:') && !spec.startsWith('cloudflare:'))
        pkgs.add(spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]);
    }
  }
  return pkgs;
}

const served = new Map(prod);
for (const name of bundled) served.set(name, all.get(name) ?? 'UNKNOWN');
for (const name of functionImports()) served.set(name, all.get(name) ?? 'UNKNOWN');
const exceptions = JSON.parse(readFileSync('scripts/license-exceptions.json', 'utf8')).dev_only;

for (const [name, license] of [...served].sort()) {
  if (!allowed(license)) problems.push(`SERVED  ${name}: ${license} (not in allowlist)`);
}
for (const [name, license] of [...all].sort()) {
  if (!DENY.test(license) || allowed(license)) continue;
  if (served.has(name)) continue; // already reported above
  if (name in exceptions) console.log(`license-gate: dev-only exception ${name} (${license}) — ${exceptions[name]}`);
  else problems.push(`TREE    ${name}: ${license} (copyleft/restricted, not a documented dev-only exception)`);
}

console.log(`license-gate: ${served.size} served package(s): ${[...served].map(([n, l]) => `${n} (${l})`).join(', ') || 'none'}`);
console.log(`license-gate: ${all.size} package(s) in the whole tree checked against the copyleft denylist.`);
if (problems.length) {
  console.error(`license-gate: FAIL\n${problems.join('\n')}`);
  process.exit(1);
}
console.log('license-gate: PASS');
