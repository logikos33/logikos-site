import sitemap from '@astrojs/sitemap';
import { defineConfig, passthroughImageService } from 'astro/config';
import { servedPackages } from './scripts/lib/served-packages';
import { alternatesFor, DEFAULT_LOCALE, INTERNAL_PATHS, LOCALES, normalizePath, routeKeyForPath } from './src/i18n/routes';

const SITE = process.env.PUBLIC_SITE_URL ?? 'https://logikosvision.com.br';
const MEDIA_BASE = process.env.PUBLIC_MEDIA_BASE_URL ?? '';
const ANALYTICS = Boolean(process.env.PUBLIC_CF_ANALYTICS_TOKEN);

const TURNSTILE = 'https://challenges.cloudflare.com';
const mediaOrigin = MEDIA_BASE ? new URL(MEDIA_BASE).origin : '';

const scriptSources = ["'self'", TURNSTILE, ...(ANALYTICS ? ['https://static.cloudflareinsights.com'] : [])];

export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    // `preserve` keeps the URL table from the brief: /recognition (file) and /en/ (directory index).
    format: 'preserve',
    inlineStylesheets: 'auto',
  },
  image: {
    // No raster pipeline: posters and marks are SVG. Keeps sharp/libvips (LGPL) out of the tree.
    service: passthroughImageService(),
  },
  i18n: {
    defaultLocale: DEFAULT_LOCALE,
    locales: [...LOCALES],
    routing: { prefixDefaultLocale: false, redirectToDefaultLocale: false },
  },
  prefetch: false,
  markdown: { syntaxHighlight: false },
  vite: {
    // Never inline fonts/images as data: URIs — keeps CSP strict and unused subsets out of the CSS.
    build: { assetsInlineLimit: 0 },
    plugins: [servedPackages()],
  },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "form-action 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        `media-src 'self'${mediaOrigin ? ` ${mediaOrigin}` : ''}`,
        `frame-src ${TURNSTILE}`,
        `connect-src 'self'${ANALYTICS ? ' https://cloudflareinsights.com' : ''}`,
      ],
      scriptDirective: { resources: scriptSources },
    },
  },
  integrations: [
    sitemap({
      filter: (page) => !INTERNAL_PATHS.some((p) => normalizePath(new URL(page).pathname) === p),
      serialize(item) {
        const match = routeKeyForPath(new URL(item.url).pathname);
        if (!match) return undefined;
        const links = alternatesFor(match.key, SITE).map(({ hreflang, href }) => ({ lang: hreflang, url: href }));
        const self = links.find(
          (l) => l.lang !== 'x-default' && normalizePath(new URL(l.url).pathname) === normalizePath(new URL(item.url).pathname),
        );
        return { ...item, url: self?.url ?? item.url, links };
      },
    }),
  ],
});
