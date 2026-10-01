import type { APIRoute, GetStaticPaths } from 'astro';
import { dict } from '../../../i18n';
import { HUD_SLOTS, posterSvg, type HudSlot } from '../../../lib/poster';

export const getStaticPaths: GetStaticPaths = () => HUD_SLOTS.map((slot) => ({ params: { slot } }));

export const GET: APIRoute = ({ params }) => {
  const slot = params.slot as HudSlot;
  const body = posterSvg(slot, dict('pt-br').hud.slots[slot], { standalone: true });
  return new Response(body, { headers: { 'Content-Type': 'image/svg+xml' } });
};
