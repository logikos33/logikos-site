// Uniform 1.5px stroke on a 24px grid, square caps and miter joins — the same
// grid as the brand symbol. Shared by <Icon> and the HUD overlay script.
export const ICON_PATHS = {
  ok: '<path d="M4 4h16v16H4z"/><path d="M8 12.5l3 3 5-6.5"/>',
  alert: '<path d="M12 3.5l9 16.5H3z"/><path d="M12 9.5v5"/><path d="M12 16.75v1"/>',
  warn: '<path d="M4 4h16v16H4z"/><path d="M9.5 9.5V8h5v3.5L12 13v1.5"/><path d="M12 16.25v1"/>',
  sun: '<path d="M8 8h8v8H8z"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
  moon: '<path d="M15.5 3.5A8.5 8.5 0 1 0 20.5 15 6.5 6.5 0 0 1 15.5 3.5z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  arrow: '<path d="M5 12h13M13 7l5 5-5 5"/>',
  chat: '<path d="M4 4h16v12H10l-4 4v-4H4z"/><path d="M8 9h8M8 12h5"/>',
  mail: '<path d="M3.5 5.5h17v13h-17z"/><path d="M3.5 6l8.5 7 8.5-7"/>',
  play: '<path d="M8 5.5v13l10-6.5z"/>',
  stop: '<path d="M7 7h10v10H7z"/>',
  replay: '<path d="M5 12a7 7 0 1 0 2.05-4.95"/><path d="M4.5 3.5v4h4"/>',
  camera: '<path d="M3 7h13v10H3z"/><path d="M16 10.5l5-3v9l-5-3"/>',
  chip: '<path d="M7 7h10v10H7z"/><path d="M10 3.5V7M14 3.5V7M10 17v3.5M14 17v3.5M3.5 10H7M3.5 14H7M17 10h3.5M17 14h3.5"/>',
  flame: '<path d="M12 3.5c.5 3 4.5 5 4.5 9.5a4.5 4.5 0 0 1-9 0c0-2.2 1.2-3.4 1.8-5 .9.9 1.4 1.8 1.4 2.8 1-1.9 1.6-4.2 1.3-7.3z"/>',
  helmet: '<path d="M3.5 16.5h17"/><path d="M6 16.5V13a6 6 0 0 1 12 0v3.5"/><path d="M12 7v4"/>',
  posture: '<path d="M14.5 4h2.5v2.5h-2.5z"/><path d="M15.5 9.5L10 12l-2 4.5M10 12l3.5 3v5M8 16.5L6 20"/>',
  zone: '<path d="M4 4h4M10 4h4M16 4h4v4M20 10v4M20 16v4h-4M14 20h-4M8 20H4v-4M4 14v-4M4 8V4"/>',
  counter: '<path d="M12 3.5v17"/><path d="M5 9l3.5 3L5 15M15.5 9l3.5 3-3.5 3"/>',
  bell: '<path d="M6 17V10a6 6 0 0 1 12 0v7"/><path d="M4 17h16"/><path d="M10 20h4"/>',
} as const;

export type IconName = keyof typeof ICON_PATHS;
