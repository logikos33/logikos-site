// Build-time Open Graph card: plain light background, the official wordmark (src/lib/brand.ts)
// inside the detection box with the mono label, the slogan below. No glitch. Rendered with
// satori -> resvg (dev-only deps); the lockup goes in as an SVG data URI so no font can
// approximate it.
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { WORDMARK_INNER, WORDMARK_RATIO, WORDMARK_VIEWBOX } from './brand';

const require = createRequire(import.meta.url);

async function font(spec: string): Promise<Buffer> {
  return readFile(require.resolve(spec));
}

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({
  type,
  props: { style, ...(children === undefined ? {} : { children }) },
});

const ACCENT = '#0091AD';
const INK = '#0A0A0F';

/** Lockup width on the card; its cap height (100 units of 115.22) is the protection area. */
const MARK_W = 720;
const MARK_H = Math.round(MARK_W / WORDMARK_RATIO);
const PROTECT = Math.round((MARK_H * 100) / 115.22);
const markUri = `data:image/svg+xml;base64,${Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${WORDMARK_VIEWBOX}" width="${MARK_W}" height="${MARK_H}" fill="${INK}">${WORDMARK_INNER}</svg>`,
).toString('base64')}`;

function corner(pos: Record<string, number>, borders: Record<string, string>): Node {
  return h('div', { position: 'absolute', width: 34, height: 34, ...pos, ...borders });
}

export async function renderOg(opts: { label: string; tagline: string; sub: string }): Promise<Buffer> {
  const [display, mono] = await Promise.all([
    font('@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff'),
    font('@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff'),
  ]);
  const line = `3px solid ${ACCENT}`;
  const tree = h(
    'div',
    {
      width: 1200,
      height: 630,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '0 96px',
      backgroundColor: '#F4F6F8',
      color: INK,
    },
    [
      h('div', { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }, [
        h(
          'div',
          {
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#0A0A0F',
            color: '#F4F6F8',
            fontFamily: 'JetBrains Mono',
            fontSize: 26,
            padding: '10px 16px',
            marginBottom: 10,
          },
          [h('div', { width: 14, height: 14, backgroundColor: '#00E5FF', marginRight: 14 }), opts.label],
        ),
        // Protection area = 1x (the cap height) on every side of the lockup.
        h('div', { position: 'relative', display: 'flex', padding: `${PROTECT}px`, border: '1px solid rgba(0,145,173,0.35)' }, [
          corner({ left: -1, top: -1 }, { borderLeft: line, borderTop: line }),
          corner({ right: -1, top: -1 }, { borderRight: line, borderTop: line }),
          corner({ left: -1, bottom: -1 }, { borderLeft: line, borderBottom: line }),
          corner({ right: -1, bottom: -1 }, { borderRight: line, borderBottom: line }),
          { type: 'img', props: { src: markUri, width: MARK_W, height: MARK_H, style: { width: MARK_W, height: MARK_H } } },
        ]),
      ]),
      h('div', { fontFamily: 'Space Grotesk', fontSize: 52, marginTop: 36, lineHeight: 1.1 }, opts.tagline),
      h('div', { fontFamily: 'JetBrains Mono', fontSize: 21, marginTop: 20, color: '#5C616B' }, opts.sub),
    ],
  );
  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Space Grotesk', data: display, weight: 700, style: 'normal' },
      { name: 'JetBrains Mono', data: mono, weight: 500, style: 'normal' },
    ],
  });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
