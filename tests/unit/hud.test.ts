// HUD adapter (raptor logikos.vision.frame/1 → boxes) and the mock clips in public/media/hud/.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { frameIndexAt, frameToBoxes, personState, type HudClip, type HudFrame, type HudLabels } from '../../src/lib/hud.ts';

const pt = JSON.parse(readFileSync('src/i18n/pt-br.json', 'utf8'));
const LABELS: HudLabels = { ...pt.hud.labels, states: pt.states, items: pt.hud.items, missing: pt.hud.missing, reasons: pt.hud.reasons };

function frame(partial: Partial<HudFrame>): HudFrame {
  return { t: 0, schema: 'logikos.vision.frame/1', people: [], hazards: [], ...partial };
}

describe('frameToBoxes', () => {
  it('worst region wins and the person verdict names the missing item', () => {
    const f = frame({
      people: [
        {
          track_id: 'p-7',
          bbox: [0.1, 0.2, 0.3, 0.9],
          ppe: [
            { region: 'torso', item: 'vest', status: 'compliant' },
            { region: 'eyes', item: 'goggles', status: 'indeterminate', reason: 'facing_away' },
            { region: 'head', item: 'helmet', status: 'non_compliant', bbox: [0.15, 0.2, 0.22, 0.27] },
          ],
        },
      ],
    });
    const [person, helmet] = frameToBoxes(f, LABELS);
    assert.equal(person?.label, 'PESSOA 07');
    assert.equal(person?.state, 'alert');
    assert.equal(person?.text, 'SEM CAPACETE');
    assert.ok(Math.abs((person?.w ?? 0) - 0.2) < 1e-9);
    assert.equal(helmet?.label, 'CAPACETE');
    assert.equal(helmet?.state, 'alert');
  });

  it('undetermined uses the operator wording of the reason', () => {
    const p = {
      track_id: 'p-4',
      bbox: [0, 0, 1, 1] as [number, number, number, number],
      ppe: [{ region: 'head', item: 'helmet', status: 'indeterminate' as const, reason: 'facing_away' }],
    };
    assert.equal(personState(p), 'warn');
    assert.equal(frameToBoxes(frame({ people: [p] }), LABELS)[0]?.text, 'DE COSTAS');
  });

  it('unknown vocabulary never leaks a raw key', () => {
    const f = frame({
      people: [
        {
          track_id: 'p-1',
          bbox: [0, 0, 0.5, 0.5],
          ppe: [{ region: 'wrist', item: 'bracelet', status: 'non_compliant', bbox: [0, 0, 0.1, 0.1] }],
        },
      ],
    });
    const boxes = frameToBoxes(f, LABELS);
    for (const b of boxes) {
      assert.ok(!b.label.includes('bracelet') && !b.text.includes('bracelet'), JSON.stringify(b));
    }
    assert.equal(boxes[0]?.text, pt.states.alert);
  });

  it('only detected hazards with a bbox are drawn, always as alert', () => {
    const f = frame({
      hazards: [
        { type: 'fire', status: 'detected', bbox: [0.6, 0.4, 0.7, 0.5] },
        { type: 'smoke', status: 'clear' },
      ],
    });
    const boxes = frameToBoxes(f, LABELS);
    assert.equal(boxes.length, 1);
    assert.equal(boxes[0]?.label, 'CHAMA');
    assert.equal(boxes[0]?.state, 'alert');
  });

  it('frameIndexAt steps without interpolation', () => {
    const frames = [{ t: 0 }, { t: 0.5 }, { t: 1 }];
    assert.equal(frameIndexAt(frames, -0.1), -1);
    assert.equal(frameIndexAt(frames, 0.49), 0);
    assert.equal(frameIndexAt(frames, 0.5), 1);
    assert.equal(frameIndexAt(frames, 9), 2);
  });
});

describe('mock clips follow the contract', () => {
  for (const file of readdirSync('public/media/hud').filter((f) => f.endsWith('.json'))) {
    it(file, () => {
      const clip = JSON.parse(readFileSync(`public/media/hud/${file}`, 'utf8')) as HudClip;
      assert.equal(clip.schema, 'logikos.site.hud/1');
      assert.equal(clip.source, 'mock');
      let prev = -1;
      for (const f of clip.frames) {
        assert.equal(f.schema, 'logikos.vision.frame/1');
        assert.ok(f.t > prev && f.t <= clip.duration_s, `t=${f.t}`);
        prev = f.t;
        const boxes = [
          ...f.people.map((p) => p.bbox),
          ...f.people.flatMap((p) => p.ppe.flatMap((e) => (e.bbox ? [e.bbox] : []))),
          ...f.hazards.flatMap((h) => (h.bbox ? [h.bbox] : [])),
        ];
        for (const [x0, y0, x1, y1] of boxes)
          assert.ok(0 <= x0 && x0 < x1 && x1 <= 1 && 0 <= y0 && y0 < y1 && y1 <= 1, `bbox ${[x0, y0, x1, y1]}`);
        for (const p of f.people) {
          for (const e of p.ppe) {
            assert.ok(['compliant', 'non_compliant', 'indeterminate'].includes(e.status));
            assert.equal(e.status === 'indeterminate', typeof e.reason === 'string', 'reason iff indeterminate');
            assert.ok(e.item in pt.hud.items, `item ${e.item} has an i18n label`);
          }
        }
        for (const h of f.hazards) assert.ok(['detected', 'clear'].includes(h.status));
      }
    });
  }
});
