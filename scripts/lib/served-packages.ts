// Vite plugin: records every node_modules package whose code or assets end up in what the
// browser downloads (client JS chunks + emitted assets such as CSS and fonts). Code that only
// runs at build time (prerender/SSR chunks) is ignored. Output: .license/served-packages.json, consumed by scripts/license-gate.mjs.
import { mkdirSync, writeFileSync } from 'node:fs';

// Minimal structural types for the Rollup output we read (vite is not a direct dependency).
interface OutputChunk {
  type: 'chunk';
  modules: Record<string, unknown>;
}
interface OutputAsset {
  type: 'asset';
  originalFileNames?: readonly string[];
}
type Bundle = Record<string, OutputChunk | OutputAsset>;

const OUT_DIR = '.license';
const OUT_FILE = `${OUT_DIR}/served-packages.json`;
const PKG_RE = /node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?((?:@[^/]+\/)?[^/]+)/;

export function servedPackages() {
  const found = new Set<string>();
  return {
    name: 'lk-served-packages',
    apply: 'build' as const,
    buildStart() {
      mkdirSync(OUT_DIR, { recursive: true });
    },
    generateBundle(this: { environment?: { name?: string } }, _options: unknown, bundle: Bundle) {
      // Client env: JS chunks and assets ship. Other envs (prerender/ssr) run at build time,
      // but Astro emits CSS and its url() assets (fonts) from there, so their assets ship too.
      const env = this.environment?.name;
      const isClient = !env || env === 'client';
      for (const output of Object.values(bundle)) {
        if (output.type === 'chunk' && !isClient) continue;
        const ids = output.type === 'chunk' ? Object.keys(output.modules) : (output.originalFileNames ?? []);
        for (const id of ids) {
          const m = PKG_RE.exec(id.replace(/\\/g, '/'));
          if (m?.[1]) found.add(m[1]);
        }
      }
      writeFileSync(OUT_FILE, `${JSON.stringify([...found].sort(), null, 2)}\n`);
    },
  };
}
