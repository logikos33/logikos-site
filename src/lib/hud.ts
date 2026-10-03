// HUD clip format. Each frame is a `logikos.vision.frame/1` object (raptor
// docs/contratos/CONTRATO-EDGE-PAINEL-v1.md §3) plus `t`, seconds from clip start.
// The edge decides state; the site only draws. Words are composed here from i18n,
// never shipped in the JSON (same rule as the raptor panel). The clip carries `meta`
// (camera id, time, clip length) as data for the caption bar.

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
  /** `fire` and `smoke` come from raptor; `zone` (a person inside a marked area) is the site's extension. */
  type: string;
  status: 'detected' | 'clear';
  bbox?: BBox;
}

export interface HudFrame {
  t: number;
  schema: 'logikos.vision.frame/1';
  people: Person[];
  hazards: Hazard[];
  /** Counting reading: crossings so far, drawn as an outlined chip at `line`. */
  count?: number;
  line?: BBox;
}

export interface HudMeta {
  /** Camera id as shown ("03"); the "CAM" word comes from i18n. */
  camera: string;
  /** Wall-clock time of the last frame, hh:mm:ss. */
  time: string;
  /** Evidence clip length in seconds (0 = no clip, e.g. counting). */
  clip_s: number;
  /** Alert channel of the person side, or null when nothing is sent. */
  channel: 'whatsapp' | 'email' | 'panel' | null;
}

export interface HudClip {
  schema: 'logikos.site.hud/1';
  /** `mock` = synthetic frames; `ia` = generated video with hand-placed frames; `raptor` = real detections. */
  source: 'mock' | 'ia' | 'raptor';
  fps: number;
  duration_s: number;
  meta: HudMeta;
  frames: HudFrame[];
}

export type HudState = 'ok' | 'alert' | 'warn';

export interface HudLabels {
  states: Record<HudState, string>;
  /** Hazard and reading words: smoke, flame, zone, posture, count, alert. */
  labels: Record<string, string>;
  /** PPE item names, keyed by the edge's `item` (open vocabulary). */
  items: Record<string, string>;
}

export interface HudBox {
  x: number;
  y: number;
  w: number;
  h: number;
  state: HudState;
  /** Chip text: state word, then the object after a middle dot ("não conforme · capacete"). */
  text: string;
  /** Outlined, non-state chip (counting). */
  outlined?: boolean;
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

/** Worst state wins: one non-compliant region makes the person non-compliant. */
export function personState(p: Person): HudState {
  const states = p.ppe.map((e) => PPE_STATE[e.status] ?? 'warn');
  if (states.includes('alert')) return 'alert';
  if (states.includes('warn')) return 'warn';
  return 'ok';
}

/** "não conforme · capacete" — unknown vocabulary falls back to the state word alone, never a raw key. */
function chipText(state: HudState, object: string | undefined, labels: HudLabels): string {
  const word = labels.states[state];
  return object ? `${word} · ${object}` : word;
}

export function frameToBoxes(frame: HudFrame, labels: HudLabels): HudBox[] {
  const boxes: HudBox[] = [];
  for (const p of frame.people) {
    const state = personState(p);
    // The decisive entry names the object on the person's chip; an all-compliant person reads just "conforme".
    const decisive = state === 'ok' ? undefined : p.ppe.find((e) => (PPE_STATE[e.status] ?? 'warn') === state);
    boxes.push({ ...toBox(p.bbox), state, text: chipText(state, decisive ? labels.items[decisive.item] : undefined, labels) });
    for (const e of p.ppe) {
      if (!e.bbox) continue;
      const s = PPE_STATE[e.status] ?? 'warn';
      boxes.push({ ...toBox(e.bbox), state: s, text: chipText(s, labels.items[e.item], labels) });
    }
  }
  for (const h of frame.hazards) {
    if (h.status !== 'detected' || !h.bbox) continue;
    const object = labels.labels[h.type === 'fire' ? 'flame' : h.type];
    boxes.push({ ...toBox(h.bbox), state: 'alert', text: `${labels.labels.alert ?? labels.states.alert}${object ? ` · ${object}` : ''}` });
  }
  if (frame.line && typeof frame.count === 'number') {
    boxes.push({ ...toBox(frame.line), state: 'ok', text: `${labels.labels.count} · ${frame.count}`, outlined: true });
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

/** Last frame's worst state: what the clip rests on, and what the caption's person side reports. */
export function clipVerdict(clip: Pick<HudClip, 'frames'>, labels: HudLabels): HudState {
  const last = clip.frames[clip.frames.length - 1];
  if (!last) return 'ok';
  const states = frameToBoxes(last, labels)
    .filter((b) => !b.outlined)
    .map((b) => b.state);
  if (states.includes('alert')) return 'alert';
  if (states.includes('warn')) return 'warn';
  return 'ok';
}
