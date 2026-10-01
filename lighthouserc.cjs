// Lighthouse CI — mobile (default form factor + throttling), home PT and EN.
// Blocking thresholds from the brief: performance ≥ 90, accessibility ≥ 95, SEO ≥ 95, best practices ≥ 90.
module.exports = {
  ci: {
    collect: {
      // LHCI's own static server over the build output (no dev tooling in the measured path).
      staticDistDir: './dist',
      url: ['http://localhost/', 'http://localhost/en/'],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --headless=new --no-proxy-server',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9, aggregationMethod: 'median-run' }],
        'categories:accessibility': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'categories:seo': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'categories:best-practices': ['error', { minScore: 0.9, aggregationMethod: 'median-run' }],
        // Home budget without video: 300 KB transferred.
        'total-byte-weight': ['error', { maxNumericValue: 300 * 1024, aggregationMethod: 'median-run' }],
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
};
