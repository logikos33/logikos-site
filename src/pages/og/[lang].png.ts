import type { APIRoute, GetStaticPaths } from 'astro';
import { dict } from '../../i18n';
import { LOCALES, type Locale } from '../../i18n/routes';
import { renderOg } from '../../lib/og';

export const getStaticPaths: GetStaticPaths = () => LOCALES.map((lang) => ({ params: { lang } }));

export const GET: APIRoute = async ({ params }) => {
  const t = dict(params.lang as Locale);
  const png = await renderOg({
    wordmark: t.brand.wordmark,
    label: t.brand.label,
    tagline: t.brand.tagline,
    sub: t.home.hero.proof.join(' · '),
  });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
