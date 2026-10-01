import type { HudSlot } from '../lib/poster';

// Final videos arrive after the trade fair (R2 via PUBLIC_MEDIA_BASE_URL).
// Until a slot lists a file here, it renders the generated poster + mock HUD.
export const MEDIA: Record<HudSlot, { video?: string; hud: string }> = {
  hero: { hud: 'hud/hero.json' },
  epi: { hud: 'hud/epi.json' },
  fire: { hud: 'hud/fire.json' },
  twins: { hud: 'hud/twins.json' },
  robotics: { hud: 'hud/robotics.json' },
};
