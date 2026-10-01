// Build-time Open Graph card: plain light background, wordmark inside the detection box with
// the mono label, tagline below. No glitch. Rendered with satori → resvg (dev-only deps).
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

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

function corner(pos: Record<string, number>, borders: Record<string, string>): Node {
  return h('div', { position: 'absolute', width: 34, height: 34, ...pos, ...borders });
}

export async function renderOg(opts: { wordmark: string; label: string; tagline: string; sub: string }): Promise<Buffer> {
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
      color: '#0A0A0F',
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
        h('div', { position: 'relative', display: 'flex', padding: '34px 52px 30px', border: '1px solid rgba(0,145,173,0.35)' }, [
          corner({ left: -1, top: -1 }, { borderLeft: line, borderTop: line }),
          corner({ right: -1, top: -1 }, { borderRight: line, borderTop: line }),
          corner({ left: -1, bottom: -1 }, { borderLeft: line, borderBottom: line }),
          corner({ right: -1, bottom: -1 }, { borderRight: line, borderBottom: line }),
          h(
            'div',
            { fontFamily: 'Space Grotesk', fontSize: 132, letterSpacing: '0.16em', lineHeight: 1, marginRight: '-0.16em' },
            opts.wordmark,
          ),
        ]),
      ]),
      h('div', { fontFamily: 'Space Grotesk', fontSize: 58, marginTop: 56, lineHeight: 1.1 }, opts.tagline),
      h('div', { fontFamily: 'JetBrains Mono', fontSize: 24, marginTop: 20, color: '#5C616B' }, opts.sub),
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
