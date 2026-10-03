import type { APIRoute, GetStaticPaths } from 'astro';
import { CLIPS } from '../../../../data/media';
import { dict } from '../../../../i18n';
import { LOCALES, type Locale } from '../../../../i18n/routes';
import type { HudLabels } from '../../../../lib/hud';
import { HUD_SLOTS, posterSvg, type HudSlot } from '../../../../lib/poster';

// Two files per slot and language: `<slot>.svg` carries the clip's last frame (the verdict
// without JavaScript, and the LCP candidate); `<slot>-plain.svg` is the same frame without
// boxes, swapped in once the script draws the overlay so nothing is drawn twice.
export const getStaticPaths: GetStaticPaths = () =>
  LOCALES.flatMap((lang) => HUD_SLOTS.flatMap((slot) => [{ params: { lang, slot } }, { params: { lang, slot: `${slot}-plain` } }]));

export const GET: APIRoute = ({ params }) => {
  const t = dict(params.lang as Locale);
  const plain = params.slot?.endsWith('-plain') ?? false;
  const slot = (plain ? params.slot?.slice(0, -'-plain'.length) : params.slot) as HudSlot;
  const labels: HudLabels = { states: t.states, labels: t.hud.labels, items: t.hud.items };
  const body = posterSvg(slot, { standalone: true, ...(plain ? {} : { clip: CLIPS[slot], labels }) });
  return new Response(body, { headers: { 'Content-Type': 'image/svg+xml' } });
};
