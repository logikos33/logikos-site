// Placeholder poster for a video slot: dark frame, "grid grego" diagonals at the Λ angle,
// the slot name in mono and — so the verdict exists without JavaScript — the clip's last
// frame drawn with the same bracket + chip anatomy the HUD script uses.
// Used inline (mock) and as /media/posters/<lang>/<slot>.svg.
import type { HudBox, HudClip, HudLabels, HudState } from './hud';
import { frameToBoxes } from './hud';

export const POSTER_W = 1600;
export const POSTER_H = 900;

export const HUD_SLOTS = ['hero', 'epi', 'fire', 'ergonomics', 'zones', 'counting', 'twins', 'robotics'] as const;
export type HudSlot = (typeof HUD_SLOTS)[number];

/** Bracket + chip geometry in viewBox units (POSTER_W × POSTER_H ≈ 2× CSS px at 800 px wide). */
export const HUD_GEOMETRY = {
  chipH: 56,
  chipPad: 18,
  chipFont: 30,
  chipGap: 8,
  stroke: 4,
  baseStroke: 8,
  minLeg: 24,
  maxLeg: 48,
} as const;

const STATE_COLOR: Record<HudState, string> = { ok: '#3DDC84', alert: '#FF5A36', warn: '#FFB020' };
const INDET = '#A9B0B9';

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c] ?? c);
}

/** Four L-shaped corners; legs are 8% of the short side, clamped. */
export function bracketPath(x: number, y: number, w: number, h: number): string {
  const c = Math.max(HUD_GEOMETRY.minLeg, Math.min(HUD_GEOMETRY.maxLeg, Math.min(w, h) * 0.16));
  return [
    `M${x} ${y + c}V${y}H${x + c}`,
    `M${x + w - c} ${y}H${x + w}V${y + c}`,
    `M${x + w} ${y + h - c}V${y + h}H${x + w - c}`,
    `M${x + c} ${y + h}H${x}V${y + h - c}`,
  ].join('');
}

const ICON: Record<HudState, string> = {
  ok: 'M4 12.5l4.5 4.5L20 6',
  alert: 'M12 4l9 16H3zM12 10v5',
  warn: 'M5 12h14',
};

/** Static SVG for one box (server-side twin of the HUD script's draw()). */
export function boxSvg(b: HudBox): string {
  const x = b.x * POSTER_W;
  const y = b.y * POSTER_H;
  const w = b.w * POSTER_W;
  const h = b.h * POSTER_H;
  const color = b.state === 'warn' ? INDET : STATE_COLOR[b.state];
  const dash = b.state === 'warn' ? ' stroke-dasharray="8 6"' : '';
  const g = HUD_GEOMETRY;
  const chipW = (b.outlined ? 0 : g.chipH * 0.6) + b.text.length * g.chipFont * 0.6 + g.chipPad * 2;
  const chipY = y - g.chipH - g.chipGap >= 0 ? y - g.chipH - g.chipGap : y + g.chipGap;
  const chip = b.outlined
    ? `<rect x="${x}" y="${chipY}" width="${chipW}" height="${g.chipH}" rx="2" fill="#0A0A0F" fill-opacity="0.7" stroke="#F4F6F8" stroke-width="2"/>` +
      `<text x="${x + g.chipPad}" y="${chipY + g.chipH * 0.68}" fill="#F4F6F8" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="${g.chipFont}">${escapeXml(b.text)}</text>`
    : `<rect x="${x}" y="${chipY}" width="${chipW}" height="${g.chipH}" rx="2" fill="${color}"/>` +
      `<path d="${ICON[b.state]}" transform="translate(${x + g.chipPad - 2} ${chipY + 10}) scale(1.15)" fill="none" stroke="#0A0A0F" stroke-width="2.4" stroke-linecap="square"/>` +
      `<text x="${x + g.chipPad + g.chipH * 0.6}" y="${chipY + g.chipH * 0.68}" fill="#0A0A0F" font-family="'Inter Variable', system-ui, sans-serif" font-size="${g.chipFont}" font-weight="600">${escapeXml(b.text)}</text>`;
  const path = bracketPath(x, y, w, h);
  return (
    `<g class="hud-pbox hud-pbox--${b.state}">` +
    `<path d="${path}" fill="none" stroke="#0A0A0F" stroke-width="${g.baseStroke}" stroke-linecap="square"/>` +
    `<path d="${path}" fill="none" stroke="${color}" stroke-width="${g.stroke}" stroke-linecap="square"${dash}/>` +
    chip +
    `</g>`
  );
}

/** `label` comes from i18n; the caption is only drawn in standalone files (video posters). */
export function posterSvg(
  slot: HudSlot,
  label: string,
  opts: { standalone?: boolean; caption?: string; clip?: HudClip; labels?: HudLabels } = {},
): string {
  const id = `lk-grid-${slot}`;
  const ns = opts.standalone ? ' xmlns="http://www.w3.org/2000/svg"' : '';
  const last = opts.clip?.frames[opts.clip.frames.length - 1];
  const boxes = last && opts.labels ? frameToBoxes(last, opts.labels) : [];
  return [
    `<svg${ns} viewBox="0 0 ${POSTER_W} ${POSTER_H}" width="${POSTER_W}" height="${POSTER_H}" preserveAspectRatio="xMidYMid slice" role="presentation" aria-hidden="true" focusable="false">`,
    `<defs><pattern id="${id}" width="48" height="120" patternUnits="userSpaceOnUse">`,
    `<path d="M0 120 L48 0 M-48 120 L0 0 M48 120 L96 0" stroke="#F4F6F8" stroke-opacity="0.06" stroke-width="1"/>`,
    `<path d="M0 0 L48 120 M-48 0 L0 120 M48 0 L96 120" stroke="#F4F6F8" stroke-opacity="0.06" stroke-width="1"/>`,
    `</pattern></defs>`,
    `<rect width="${POSTER_W}" height="${POSTER_H}" fill="#14141C"/>`,
    // The grid is decoration for covers: hidden as soon as the HUD draws verdicts (see HudVideo).
    `<rect class="hud-poster__grid" width="${POSTER_W}" height="${POSTER_H}" fill="url(#${id})"/>`,
    `<text x="${POSTER_W - 64}" y="${POSTER_H - 56}" text-anchor="end" fill="#8A8F98" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="28" letter-spacing="3">${escapeXml(label.toUpperCase())}</text>`,
    // The verdict at rest: the last frame, drawn once at build time.
    `<g class="hud-poster__verdict">${boxes.map(boxSvg).join('')}</g>`,
    ...(opts.standalone && opts.caption
      ? [
          `<text x="64" y="${POSTER_H - 56}" fill="#F4F6F8" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="30">${escapeXml(opts.caption)}</text>`,
        ]
      : []),
    `</svg>`,
  ].join('');
}
