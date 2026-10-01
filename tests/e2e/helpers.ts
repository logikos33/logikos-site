import { readFileSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';
import { LOCALES, ROUTE_KEYS, ROUTES } from '../../src/i18n/routes.ts';

export const ALL_ROUTES = ROUTE_KEYS.flatMap((key) => LOCALES.map((locale) => ({ key, locale, path: ROUTES[key][locale] })));

export const SITE = process.env.PUBLIC_SITE_URL ?? 'https://logikosvision.com.br';

export function trackConsole(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

export async function setTheme(page: Page, theme: 'light' | 'dark'): Promise<void> {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem('lk-theme', t);
    } catch {
      // ignore
    }
  }, theme);
}

/** Replaces the Turnstile loader with a deterministic stub that yields Cloudflare's dummy token. */
export async function stubTurnstile(page: Page): Promise<void> {
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `window.turnstile = { render: () => 'stub', getResponse: () => 'XXXX.DUMMY.TOKEN.XXXX', reset: () => {} }; window.lkTurnstileReady && window.lkTurnstileReady();`,
    }),
  );
}

export function wranglerLog(): string {
  try {
    return readFileSync('test-results/wrangler.log', 'utf8');
  } catch {
    return '';
  }
}

export async function expectNoConsoleErrors(errors: string[]): Promise<void> {
  expect(errors, errors.join('\n')).toEqual([]);
}
