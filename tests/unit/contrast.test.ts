// Every filled verdict chip (color + icon + word) must keep its ink at AA for small bold text
// (≥ 4.5:1), in both themes and on the dark HUD ramp. Reads the tokens, never hard-codes them.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const css = readFileSync('src/styles/tokens.css', 'utf8');

function block(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1] ?? '', (m[2] ?? '').toLowerCase()]));
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (l1 + 0.05) / (l2 + 0.05);
}

describe('verdict chip ink', () => {
  for (const [name, selector] of [
    ['light', ':root,'],
    ['dark', "[data-theme='dark']"],
  ] as const) {
    const t = block(selector);
    for (const state of ['ok', 'alert', 'warn'] as const) {
      it(`${name}: ${state} fill vs ink ≥ 4.5:1`, () => {
        const fill = t[`lk-${state}`];
        const ink = t[`lk-${state}-ink`];
        assert.ok(fill && ink, `tokens for ${state}`);
        const ratio = contrast(fill, ink);
        assert.ok(ratio >= 4.5, `${state}: ${fill} on ${ink} = ${ratio.toFixed(2)}`);
      });
    }
    it(`${name}: body text vs background ≥ 7:1 and secondary text ≥ 4.5:1`, () => {
      assert.ok(contrast(t['lk-text'] ?? '', t['lk-bg'] ?? '') >= 7);
      assert.ok(contrast(t['lk-text-2'] ?? '', t['lk-bg'] ?? '') >= 4.5);
      assert.ok(contrast(t['lk-text-2'] ?? '', t['lk-surface'] ?? '') >= 4.5);
    });
  }

  it('HUD ramp: dark ink on every fill ≥ 4.5:1 and the fills ≥ 3:1 against the frame', () => {
    const h = block('.lk-hud-scope');
    for (const k of ['hud-ok', 'hud-alert', 'hud-warn', 'hud-indet']) {
      assert.ok(contrast(h[k] ?? '', h['hud-ink'] ?? '') >= 4.5, k);
      assert.ok(contrast(h[k] ?? '', '#14141c') >= 3, `${k} vs frame`);
    }
  });
});
