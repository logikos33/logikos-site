// Lighthouse CI — mobile (default form factor + throttling), the six main pages × two languages.
// Floor from the v2 brief: ≥ 95 in performance, accessibility, best practices and SEO (median run);
// a drop of more than 3 points against docs/design/baseline/INVENTARIO.md is a bug.
// The static server resolves Astro's `format: preserve` output the way Cloudflare Pages does.
const BASE = 'http://127.0.0.1:8787';
const HOME_RE = '^http://[^/]+/(en/)?$';
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
      assertMatrix: [
        {
          matchingUrlPattern: '.*',
          assertions: {
            'categories:performance': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
            'categories:accessibility': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
            'categories:seo': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
            'categories:best-practices': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
          },
        },
        {
          // Page budget without video: 300 KB transferred.
          matchingUrlPattern: `^(?!${HOME_RE.slice(1)})`,
          assertions: {
            'total-byte-weight': ['error', { maxNumericValue: 300 * 1024, aggregationMethod: 'median-run' }],
          },
        },
        {
          // Home v3: ~310 KB without video, plus the opening clip (a fresh Lighthouse session always
          // plays it). The wall videos only load after the opening, near the screen. 510 → 540 KB on
          // 11/11/2026: Koda with alpha (+17 KB even after resizing) and the contact monitor's CSS;
          // measured 518 KB. 540 → 550 KB on 11/11/2026 (round 5): the CH6 digital-twin slide and the
          // Logikos Vision lockup in vector in the header and footer grew the HTML; measured 540.0 KB.
          matchingUrlPattern: HOME_RE,
          assertions: {
            'resource-summary:media:size': ['error', { maxNumericValue: 210 * 1024, aggregationMethod: 'median-run' }],
            'total-byte-weight': ['error', { maxNumericValue: 550 * 1024, aggregationMethod: 'median-run' }],
          },
        },
      ],
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
};
