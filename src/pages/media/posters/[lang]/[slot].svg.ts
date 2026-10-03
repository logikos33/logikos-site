import type { APIRoute, GetStaticPaths } from 'astro';
import { dict } from '../../../../i18n';
import { LOCALES, type Locale } from '../../../../i18n/routes';
import { HUD_SLOTS, posterSvg, type HudSlot } from '../../../../lib/poster';

export const getStaticPaths: GetStaticPaths = () => LOCALES.flatMap((lang) => HUD_SLOTS.map((slot) => ({ params: { lang, slot } })));

export const GET: APIRoute = ({ params }) => {
  const t = dict(params.lang as Locale);
  const slot = params.slot as HudSlot;
  const body = posterSvg(slot, { standalone: true, caption: t.hud.slots[slot] });
  return new Response(body, { headers: { 'Content-Type': 'image/svg+xml' } });
};
