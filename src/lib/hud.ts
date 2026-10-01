// HUD clip format. Each frame is a `logikos.vision.frame/1` object (raptor
// docs/contratos/CONTRATO-EDGE-PAINEL-v1.md §3) plus `t`, seconds from clip start.
// The edge decides state; the site only draws. Labels are composed here from i18n,
// never shipped in the JSON (same rule as the raptor panel).

export type PpeStatus = 'compliant' | 'non_compliant' | 'indeterminate';
export type BBox = [number, number, number, number];

export interface PpeEntry {
  region: string;
  item: string;
  status: PpeStatus;
  bbox?: BBox;
  reason?: string;
}

export interface Person {
  track_id: string;
  bbox: BBox;
  ppe: PpeEntry[];
}

export interface Hazard {
  type: string;
  status: 'detected' | 'clear';
  bbox?: BBox;
}

export interface HudFrame {
  t: number;
  schema: 'logikos.vision.frame/1';
  people: Person[];
  hazards: Hazard[];
}

export interface HudClip {
  schema: 'logikos.site.hud/1';
  source: 'mock' | 'raptor';
  fps: number;
  duration_s: number;
  frames: HudFrame[];
}

export type HudState = 'ok' | 'alert' | 'warn';

export interface HudLabels {
  person: string;
  smoke: string;
  flame: string;
  ppeOk: string;
  fireAlert: string;
  states: Record<HudState, string>;
  /** PPE item names, keyed by the edge's `item` (open vocabulary). */
  items: Record<string, string>;
  /** "Without <item>" verdicts, keyed by `item`. */
  missing: Record<string, string>;
  /** Operator wording for `reason` when status is indeterminate. */
  reasons: Record<string, string>;
}

export interface HudBox {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  state: HudState;
  text: string;
}

const PPE_STATE: Record<PpeStatus, HudState> = {
  compliant: 'ok',
  non_compliant: 'alert',
  indeterminate: 'warn',
};

function toBox(b: BBox): Pick<HudBox, 'x' | 'y' | 'w' | 'h'> {
  const [x0, y0, x1, y1] = b;
  return { x: x0, y: y0, w: Math.max(0, x1 - x0), h: Math.max(0, y1 - y0) };
}

function trackNumber(id: string): string {
  const digits = id.replace(/\D/g, '');
  return digits ? digits.padStart(2, '0') : id;
}

/** Worst state wins: one non-compliant region makes the person non-compliant. */
export function personState(p: Person): HudState {
  const states = p.ppe.map((e) => PPE_STATE[e.status] ?? 'warn');
  if (states.includes('alert')) return 'alert';
  if (states.includes('warn')) return 'warn';
  return 'ok';
}

/** Verdict wording for one PPE entry. Unknown vocabulary falls back to the state word, never a raw key. */
function entryText(e: PpeEntry, state: HudState, labels: HudLabels): string {
  if (state === 'alert') return labels.missing[e.item] ?? labels.states.alert;
  if (state === 'warn') return labels.reasons[e.reason ?? 'unknown'] ?? labels.states.warn;
  return labels.states.ok;
}

export function frameToBoxes(frame: HudFrame, labels: HudLabels): HudBox[] {
  const boxes: HudBox[] = [];
  for (const p of frame.people) {
    const state = personState(p);
    const decisive = p.ppe.find((e) => (PPE_STATE[e.status] ?? 'warn') === state);
    const text = state === 'ok' || !decisive ? labels.ppeOk : entryText(decisive, state, labels);
    boxes.push({ ...toBox(p.bbox), label: `${labels.person} ${trackNumber(p.track_id)}`, state, text });
    for (const e of p.ppe) {
      if (!e.bbox) continue;
      const s = PPE_STATE[e.status] ?? 'warn';
      boxes.push({ ...toBox(e.bbox), label: labels.items[e.item] ?? labels.states[s], state: s, text: entryText(e, s, labels) });
    }
  }
  for (const h of frame.hazards) {
    if (h.status !== 'detected' || !h.bbox) continue;
    const label = h.type === 'smoke' ? labels.smoke : labels.flame;
    boxes.push({ ...toBox(h.bbox), label, state: 'alert', text: labels.fireAlert });
  }
  return boxes;
}

/** Index of the frame on screen at time `t` (step semantics, no interpolation). */
export function frameIndexAt(frames: readonly { t: number }[], t: number): number {
  let idx = -1;
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    if (f && f.t <= t) idx = i;
    else break;
  }
  return idx;
}
