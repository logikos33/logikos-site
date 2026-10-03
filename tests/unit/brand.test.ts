// The official marks (src/lib/brand.ts) — the site may never fall back to a text wordmark.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MONOGRAM_INNER, SYMBOL_INNER, WORDMARK_INNER, WORDMARK_RATIO, WORDMARK_VIEWBOX } from '../../src/lib/brand.ts';

describe('brand marks', () => {
  it('the wordmark carries the L on the Λ angle and the keyhole O, plus the plain second O', () => {
    assert.match(WORDMARK_INNER, /data-glyph="L"/);
    assert.match(WORDMARK_INNER, /data-glyph="O" fill-rule="evenodd" d="M317\.55 260\.50A63\.50 63\.50/);
    assert.match(WORDMARK_INNER, /data-glyph="O2"/);
    assert.equal(WORDMARK_VIEWBOX, '0 0 749.98 115.22');
    assert.ok(WORDMARK_RATIO > 6.5 && WORDMARK_RATIO < 6.52, 'lockup proportion 6.509:1');
  });

  it('the symbol is the keyhole alone and the monogram the Λ disc', () => {
    assert.match(SYMBOL_INNER, /A63\.50 63\.50/);
    assert.doesNotMatch(SYMBOL_INNER, /data-glyph="L"/);
    assert.match(MONOGRAM_INNER, /scale\(0\.787402\)/);
  });

  it('nothing is hard-coloured: every path inherits currentColor', () => {
    for (const inner of [WORDMARK_INNER, SYMBOL_INNER, MONOGRAM_INNER]) {
      assert.doesNotMatch(inner, /fill="#/);
      assert.doesNotMatch(inner, /stroke="#/);
    }
  });
});
