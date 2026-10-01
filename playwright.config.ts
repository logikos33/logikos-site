import { defineConfig, devices } from '@playwright/test';

const PORT = 8788;
// Local containers may ship their own Chromium; CI uses `playwright install`.
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 2,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }, testIgnore: /mobile\.spec\.ts/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: {
    // Serves dist/ + functions/ exactly like Cloudflare Pages, with a local KV for LEADS_KV.
    // Output is teed to a log so the form test can prove no lead value is ever logged.
    command: `mkdir -p test-results && WRANGLER_SEND_METRICS=false pnpm exec wrangler pages dev dist --port ${PORT} --ip 127.0.0.1 --persist-to .wrangler/e2e 2>&1 | tee test-results/wrangler.log`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
