// Deterministic generator for the mock HUD clips in public/media/hud/.
// Frames follow raptor's `logikos.vision.frame/1` (docs/contratos/CONTRATO-EDGE-PAINEL-v1.md §3)
// plus `t` (seconds from clip start). Run: node scripts/gen-mock-hud.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = new URL('../public/media/hud/', import.meta.url);
const round = (n) => Math.round(n * 1000) / 1000;
const bbox = (x0, y0, w, h) => [round(x0), round(y0), round(x0 + w), round(y0 + h)];

function clip(frames, duration) {
  return {
    schema: 'logikos.site.hud/1',
    source: 'mock',
    fps: 30,
    duration_s: duration,
    frames: frames.map((f) => ({ t: f.t, schema: 'logikos.vision.frame/1', people: f.people ?? [], hazards: f.hazards ?? [] })),
  };
}

function person(id, x, y, w, h, ppe) {
  return {
    track_id: id,
    bbox: bbox(x, y, w, h),
    ppe: ppe.map(([region, item, status, box, reason]) => ({
      region,
      item,
      status,
      ...(box ? { bbox: box } : {}),
      ...(status === 'indeterminate' ? { reason: reason ?? 'occluded' } : {}),
    })),
  };
}

const steps = (n, dt) => Array.from({ length: n }, (_, i) => round(i * dt));

// Hero: a worker walks in with a hard hat, takes it off; a flame starts on the bench.
const hero = clip(
  steps(13, 0.5).map((t, i) => {
    const x = 0.14 + Math.min(i, 8) * 0.022;
    const helmetOn = i < 6;
    const ppe = [
      ['head', 'helmet', helmetOn ? 'compliant' : 'non_compliant', helmetOn ? bbox(x + 0.045, 0.24, 0.06, 0.07) : undefined],
      ['torso', 'vest', 'compliant'],
      ['hands', 'gloves', i >= 9 ? 'indeterminate' : 'compliant', undefined, 'occluded'],
    ];
    const hazards =
      i >= 7
        ? [{ type: 'fire', status: 'detected', bbox: bbox(0.64, 0.5 - (i - 7) * 0.006, 0.08 + (i - 7) * 0.006, 0.12 + (i - 7) * 0.008) }]
        : [{ type: 'fire', status: 'clear' }];
    return { t, people: [person('p-7', x, 0.24, 0.15, 0.68, ppe)], hazards };
  }),
  6.5,
);

// EPI: two workers; one compliant, one goes from undetermined (occluded) to non-compliant.
const epi = clip(
  steps(11, 0.5).map((t, i) => ({
    t,
    people: [
      person('p-3', 0.18, 0.2, 0.16, 0.72, [
        ['head', 'helmet', 'compliant', bbox(0.225, 0.2, 0.065, 0.075)],
        ['torso', 'vest', 'compliant'],
      ]),
      person('p-4', 0.56 + i * 0.008, 0.26, 0.15, 0.66, [
        ['head', 'helmet', i < 4 ? 'indeterminate' : 'non_compliant', undefined, 'facing_away'],
        ['torso', 'vest', 'compliant'],
      ]),
    ],
  })),
  5.5,
);

// Fire: smoke first, then flame.
const fire = clip(
  steps(11, 0.5).map((t, i) => ({
    t,
    hazards: [
      i >= 2 ? { type: 'smoke', status: 'detected', bbox: bbox(0.38, 0.18, 0.26 + i * 0.006, 0.3) } : { type: 'smoke', status: 'clear' },
      i >= 6 ? { type: 'fire', status: 'detected', bbox: bbox(0.46, 0.52, 0.1, 0.14) } : { type: 'fire', status: 'clear' },
    ],
  })),
  5.5,
);

// Robotics: a quadruped patrol view; one worker in frame.
const robotics = clip(
  steps(9, 0.5).map((t, i) => ({
    t,
    people: [
      person('p-2', 0.62 - i * 0.012, 0.3, 0.12, 0.56, [
        ['head', 'helmet', 'compliant', bbox(0.655 - i * 0.012, 0.3, 0.05, 0.06)],
        ['torso', 'vest', 'compliant'],
      ]),
    ],
  })),
  4.5,
);

// Twins: no detections — the slot shows the point-cloud capture placeholder only.
const twins = clip([{ t: 0 }], 1);

mkdirSync(OUT, { recursive: true });
for (const [name, data] of Object.entries({ hero, epi, fire, robotics, twins })) {
  writeFileSync(new URL(`${name}.json`, OUT), `${JSON.stringify(data)}\n`);
}
console.log('mock HUD clips written to public/media/hud/');
