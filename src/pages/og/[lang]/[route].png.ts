import type { APIRoute, GetStaticPaths } from 'astro';
import { dict } from '../../../i18n';
import { LOCALES, ROUTE_KEYS, type Locale, type RouteKey } from '../../../i18n/routes';
import { renderOg } from '../../../lib/og';

/** The page's own title (the part before the site-name separator) becomes the card's sub line. */
function titleFor(locale: Locale, route: RouteKey): string {
  const t = dict(locale);
  const titles: Record<RouteKey, string> = {
    home: t.home.hero.sub,
    recognition: t.recognition.meta.title,
    howItWorks: t.howItWorks.meta.title,
    demos: t.demos.meta.title,
    platform: t.platform.meta.title,
    partners: t.partners.meta.title,
    twins: t.twins.meta.title,
    robotics: t.robotics.meta.title,
    compliance: t.compliance.meta.title,
    about: t.about.meta.title,
    contact: t.contact.meta.title,
    privacy: t.privacy.meta.title,
  };
  return titles[route];
}

export const getStaticPaths: GetStaticPaths = () => LOCALES.flatMap((lang) => ROUTE_KEYS.map((route) => ({ params: { lang, route } })));

export const GET: APIRoute = async ({ params }) => {
  const locale = params.lang as Locale;
  const t = dict(locale);
  const png = await renderOg({
    label: t.brand.label,
    tagline: t.brand.tagline,
    sub: titleFor(locale, params.route as RouteKey),
  });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
