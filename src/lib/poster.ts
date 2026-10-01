// Placeholder poster for a video slot: dark frame, "grid grego" diagonals at the Λ
// angle and the slot name in mono. Used inline (mock) and as /media/posters/<slot>.svg.

export const POSTER_W = 1600;
export const POSTER_H = 900;

export const HUD_SLOTS = ['hero', 'epi', 'fire', 'twins', 'robotics'] as const;
export type HudSlot = (typeof HUD_SLOTS)[number];

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c] ?? c);
}

export function posterSvg(slot: HudSlot, caption: string, opts: { standalone?: boolean } = {}): string {
  const id = `lk-grid-${slot}`;
  // Λ legs lean ~22° off vertical; the pattern is a 48px lattice of both diagonals.
  const ns = opts.standalone ? ' xmlns="http://www.w3.org/2000/svg"' : '';
  return [
    `<svg${ns} viewBox="0 0 ${POSTER_W} ${POSTER_H}" width="${POSTER_W}" height="${POSTER_H}" preserveAspectRatio="xMidYMid slice" role="presentation" aria-hidden="true" focusable="false">`,
    `<defs><pattern id="${id}" width="48" height="120" patternUnits="userSpaceOnUse">`,
    `<path d="M0 120 L48 0 M-48 120 L0 0 M48 120 L96 0" stroke="#F4F6F8" stroke-opacity="0.06" stroke-width="1"/>`,
    `<path d="M0 0 L48 120 M-48 0 L0 120 M48 0 L96 120" stroke="#F4F6F8" stroke-opacity="0.06" stroke-width="1"/>`,
    `</pattern></defs>`,
    `<rect width="${POSTER_W}" height="${POSTER_H}" fill="#14141C"/>`,
    `<rect width="${POSTER_W}" height="${POSTER_H}" fill="url(#${id})"/>`,
    `<rect x="${POSTER_W - 64 - 16}" y="${POSTER_H - 120}" width="16" height="16" fill="#00E5FF"/>`,
    `<text x="${POSTER_W - 96}" y="${POSTER_H - 104}" text-anchor="end" fill="#8A8F98" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="28" letter-spacing="3">${escapeXml(`SLOT · ${slot.toUpperCase()}`)}</text>`,
    ...(opts.standalone
      ? [
          `<text x="${POSTER_W - 64}" y="${POSTER_H - 56}" text-anchor="end" fill="#F4F6F8" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="30">${escapeXml(caption)}</text>`,
        ]
      : []),
    `</svg>`,
  ].join('');
}
