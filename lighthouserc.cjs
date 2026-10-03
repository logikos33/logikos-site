// Lighthouse CI — mobile (default form factor + throttling), the six main pages × two languages.
// Floor from the v2 brief: ≥ 95 in performance, accessibility, best practices and SEO (median run);
// a drop of more than 3 points against docs/design/baseline/INVENTARIO.md is a bug.
// The static server resolves Astro's `format: preserve` output the way Cloudflare Pages does.
const BASE = 'http://127.0.0.1:8787';
const PAGES = [
  '/',
  '/en/',
  '/recognition',
  '/en/recognition',
  '/como-funciona',
  '/en/how-it-works',
  '/integradores',
  '/en/partners',
  '/demos',
  '/en/demos',
  '/plataforma',
  '/en/platform',
];

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'node scripts/serve-dist.mjs 8787',
      startServerReadyPattern: 'serving dist/',
      url: PAGES.map((p) => `${BASE}${p}`),
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --headless=new --no-proxy-server',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'categories:accessibility': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'categories:seo': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'categories:best-practices': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
        // Page budget without video: 300 KB transferred.
        'total-byte-weight': ['error', { maxNumericValue: 300 * 1024, aggregationMethod: 'median-run' }],
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
};
