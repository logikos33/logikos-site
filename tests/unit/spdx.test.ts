import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { spdxAllowed } from '../../scripts/lib/spdx.mjs';

const ALLOW = new Set(['MIT', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', 'ISC', '0BSD', 'CC0-1.0', 'OFL-1.1', 'MPL-2.0']);

describe('spdxAllowed', () => {
  const cases: [string, boolean][] = [
    ['MIT', true],
    ['(MIT OR Apache-2.0)', true],
    ['MIT AND ISC', true],
    ['GPL-3.0 OR MIT', true],
    ['(MIT)', true],
    ['(MIT OR CC0-1.0) AND LGPL-3.0-only', false],
    ['(MIT OR Apache-2.0) AND CC-BY-4.0', false],
    ['(MIT OR GPL-3.0) AND GPL-3.0', false],
    ['MIT AND GPL-2.0-or-later', false],
    ['Apache-2.0 WITH LLVM-exception', false],
    ['SEE LICENSE IN LICENSE', false],
    ['UNKNOWN', false],
    ['BlueOak-1.0.0', false],
    ['(MIT', false],
    ['', false],
  ];
  for (const [expr, expected] of cases) {
    it(`${JSON.stringify(expr)} → ${expected}`, () => assert.equal(spdxAllowed(expr, ALLOW), expected));
  }
});
