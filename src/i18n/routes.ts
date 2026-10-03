// Single source of truth for localized slugs. Drives page routing, hreflang,
// the language switcher, sitemap alternates and the e2e route inventory.

export const LOCALES = ['pt-br', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'pt-br';

/** BCP 47 tags for `<html lang>` and `hreflang`. */
export const HTML_LANG: Record<Locale, string> = {
  'pt-br': 'pt-BR',
  en: 'en',
};

/** Open Graph locale tags. */
export const OG_LOCALE: Record<Locale, string> = {
  'pt-br': 'pt_BR',
  en: 'en_US',
};

export const ROUTES = {
  home: { 'pt-br': '/', en: '/en/' },
  recognition: { 'pt-br': '/recognition', en: '/en/recognition' },
  howItWorks: { 'pt-br': '/como-funciona', en: '/en/how-it-works' },
  demos: { 'pt-br': '/demos', en: '/en/demos' },
  platform: { 'pt-br': '/plataforma', en: '/en/platform' },
  partners: { 'pt-br': '/integradores', en: '/en/partners' },
  twins: { 'pt-br': '/twins', en: '/en/twins' },
  robotics: { 'pt-br': '/robotica', en: '/en/robotics' },
  compliance: { 'pt-br': '/conformidade', en: '/en/compliance' },
  about: { 'pt-br': '/sobre', en: '/en/about' },
  contact: { 'pt-br': '/contato', en: '/en/contact' },
  privacy: { 'pt-br': '/privacidade', en: '/en/privacy' },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteKey = keyof typeof ROUTES;
export const ROUTE_KEYS = Object.keys(ROUTES) as RouteKey[];

/** Internal pages that exist but stay out of the sitemap and search indexes. */
export const INTERNAL_PATHS = ['/_marca'] as const;

export function pathFor(key: RouteKey, locale: Locale): string {
  return ROUTES[key][locale];
}

export function absoluteUrl(path: string, site: URL | string): string {
  return new URL(path, site).href;
}

/** Normalizes a pathname so `/en`, `/en/`, `/sobre.html` and `/sobre/` compare equal. */
export function normalizePath(pathname: string): string {
  let p = pathname.replace(/\.html$/, '').replace(/\/index$/, '/');
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p === '' ? '/' : p;
}

export function routeKeyForPath(pathname: string): { key: RouteKey; locale: Locale } | undefined {
  const target = normalizePath(pathname);
  for (const key of ROUTE_KEYS) {
    for (const locale of LOCALES) {
      if (normalizePath(ROUTES[key][locale]) === target) return { key, locale };
    }
  }
  return undefined;
}

/** hreflang alternates for a route, including x-default pointing at PT-BR. */
export function alternatesFor(key: RouteKey, site: URL | string): { hreflang: string; href: string }[] {
  return [
    ...LOCALES.map((locale) => ({ hreflang: HTML_LANG[locale], href: absoluteUrl(ROUTES[key][locale], site) })),
    { hreflang: 'x-default', href: absoluteUrl(ROUTES[key][DEFAULT_LOCALE], site) },
  ];
}
