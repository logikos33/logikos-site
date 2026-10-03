// HUD adapter (raptor logikos.vision.frame/1 → boxes) and the mock clips in public/media/hud/.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { clipVerdict, frameIndexAt, frameToBoxes, personState, type HudClip, type HudFrame, type HudLabels } from '../../src/lib/hud.ts';

const pt = JSON.parse(readFileSync('src/i18n/pt-br.json', 'utf8'));
const LABELS: HudLabels = { states: pt.states, labels: pt.hud.labels, items: pt.hud.items };

function frame(partial: Partial<HudFrame>): HudFrame {
  return { t: 0, schema: 'logikos.vision.frame/1', people: [], hazards: [], ...partial };
}

describe('frameToBoxes', () => {
  it('worst region wins and the person chip names the missing item after the state word', () => {
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
    assert.equal(person?.state, 'alert');
    assert.equal(person?.text, `${pt.states.alert} · ${pt.hud.items.helmet}`);
    assert.ok(Math.abs((person?.w ?? 0) - 0.2) < 1e-9);
    assert.equal(helmet?.state, 'alert');
    assert.equal(helmet?.text, `${pt.states.alert} · ${pt.hud.items.helmet}`);
  });

  it('an all-compliant person reads just the state word', () => {
    const f = frame({
      people: [{ track_id: 'p-1', bbox: [0, 0, 0.5, 0.5], ppe: [{ region: 'torso', item: 'vest', status: 'compliant' }] }],
    });
    assert.equal(frameToBoxes(f, LABELS)[0]?.text, pt.states.ok);
  });

  it('indeterminate names the item, never the reason (the reason belongs to the legend)', () => {
    const p = {
      track_id: 'p-4',
      bbox: [0, 0, 1, 1] as [number, number, number, number],
      ppe: [{ region: 'hands', item: 'gloves', status: 'indeterminate' as const, reason: 'occluded' }],
    };
    assert.equal(personState(p), 'warn');
    assert.equal(frameToBoxes(frame({ people: [p] }), LABELS)[0]?.text, `${pt.states.warn} · ${pt.hud.items.gloves}`);
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
      hazards: [{ type: 'meteor', status: 'detected', bbox: [0.5, 0.5, 0.6, 0.6] }],
    });
    const boxes = frameToBoxes(f, LABELS);
    for (const b of boxes) assert.ok(!b.text.includes('bracelet') && !b.text.includes('meteor'), JSON.stringify(b));
    assert.equal(boxes[0]?.text, pt.states.alert);
    assert.equal(boxes[2]?.text, pt.hud.labels.alert);
  });

  it('only detected hazards with a bbox are drawn, as "alerta · <object>"', () => {
    const f = frame({
      hazards: [
        { type: 'fire', status: 'detected', bbox: [0.6, 0.4, 0.7, 0.5] },
        { type: 'smoke', status: 'clear' },
        { type: 'zone', status: 'detected', bbox: [0.1, 0.5, 0.5, 0.9] },
      ],
    });
    const boxes = frameToBoxes(f, LABELS);
    assert.equal(boxes.length, 2);
    assert.equal(boxes[0]?.text, `${pt.hud.labels.alert} · ${pt.hud.labels.flame}`);
    assert.equal(boxes[1]?.text, `${pt.hud.labels.alert} · ${pt.hud.labels.zone}`);
    assert.ok(boxes.every((b) => b.state === 'alert'));
  });

  it('counting draws one outlined chip at the line and never raises an alert', () => {
    const f = frame({ count: 12, line: [0.5, 0.1, 0.504, 0.9] });
    const boxes = frameToBoxes(f, LABELS);
    assert.equal(boxes.length, 1);
    assert.equal(boxes[0]?.outlined, true);
    assert.equal(boxes[0]?.text, `${pt.hud.labels.count} · 12`);
    assert.equal(clipVerdict({ frames: [f] }, LABELS), 'ok');
  });

  it('clipVerdict rests on the last frame', () => {
    const ok = frame({ people: [{ track_id: 'a', bbox: [0, 0, 1, 1], ppe: [{ region: 'torso', item: 'vest', status: 'compliant' }] }] });
    const bad = frame({ t: 1, hazards: [{ type: 'smoke', status: 'detected', bbox: [0, 0, 0.2, 0.2] }] });
    assert.equal(clipVerdict({ frames: [bad, ok] }, LABELS), 'ok');
    assert.equal(clipVerdict({ frames: [ok, bad] }, LABELS), 'alert');
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
  const files = readdirSync('public/media/hud').filter((f) => f.endsWith('.json'));
  it('the served copy and the build-time copy are identical', () => {
    for (const file of files)
      assert.equal(readFileSync(`public/media/hud/${file}`, 'utf8'), readFileSync(`src/data/hud/${file}`, 'utf8'), file);
  });
  for (const file of files) {
    it(file, () => {
      const clip = JSON.parse(readFileSync(`public/media/hud/${file}`, 'utf8')) as HudClip;
      assert.equal(clip.schema, 'logikos.site.hud/1');
      assert.ok(['mock', 'ia', 'raptor'].includes(clip.source));
      assert.match(clip.meta.camera, /^\d{2}$/);
      assert.match(clip.meta.time, /^\d{2}:\d{2}:\d{2}$/);
      assert.ok(clip.meta.clip_s >= 0);
      assert.ok([null, 'whatsapp', 'email', 'panel'].includes(clip.meta.channel));
      let prev = -1;
      for (const f of clip.frames) {
        assert.equal(f.schema, 'logikos.vision.frame/1');
        assert.ok(f.t > prev && f.t <= clip.duration_s, `t=${f.t}`);
        prev = f.t;
        const boxes = [
          ...f.people.map((p) => p.bbox),
          ...f.people.flatMap((p) => p.ppe.flatMap((e) => (e.bbox ? [e.bbox] : []))),
          ...f.hazards.flatMap((h) => (h.bbox ? [h.bbox] : [])),
          ...(f.line ? [f.line] : []),
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
        for (const h of f.hazards) {
          assert.ok(['detected', 'clear'].includes(h.status));
          assert.ok(h.type === 'fire' || h.type in pt.hud.labels, `hazard ${h.type} has an i18n label`);
        }
      }
    });
  }
});
