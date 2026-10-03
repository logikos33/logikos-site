import type { HudClip } from '../lib/hud';
import type { HudSlot } from '../lib/poster';
import counting from './hud/counting.json';
import epi from './hud/epi.json';
import ergonomics from './hud/ergonomics.json';
import fire from './hud/fire.json';
import hero from './hud/hero.json';
import robotics from './hud/robotics.json';
import twins from './hud/twins.json';
import zones from './hud/zones.json';

// Final videos arrive from the media round (R2 via PUBLIC_MEDIA_BASE_URL or /media).
// Until a slot lists a file here, it renders the generated poster + the clip's last frame.
export const MEDIA: Record<HudSlot, { video?: string; hud: string }> = {
  hero: { hud: 'hud/hero.json' },
  epi: { hud: 'hud/epi.json' },
  fire: { hud: 'hud/fire.json' },
  ergonomics: { hud: 'hud/ergonomics.json' },
  zones: { hud: 'hud/zones.json' },
  counting: { hud: 'hud/counting.json' },
  twins: { hud: 'hud/twins.json' },
  robotics: { hud: 'hud/robotics.json' },
};

/** Build-time copy of each clip (same files the browser fetches) for posters and captions. */
export const CLIPS: Record<HudSlot, HudClip> = {
  hero: hero as unknown as HudClip,
  epi: epi as unknown as HudClip,
  fire: fire as unknown as HudClip,
  ergonomics: ergonomics as unknown as HudClip,
  zones: zones as unknown as HudClip,
  counting: counting as unknown as HudClip,
  twins: twins as unknown as HudClip,
  robotics: robotics as unknown as HudClip,
};

/** The five readings of the stage, in display order. */
export const READINGS = ['fire', 'epi', 'ergonomics', 'zones', 'counting'] as const satisfies readonly HudSlot[];
export type Reading = (typeof READINGS)[number];
