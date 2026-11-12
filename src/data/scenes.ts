// Still scenes with detection boxes drawn in code (rodada soluções). Artlist frames approved by Vitor
// (12/11/2026); boxes in source pixels, labels from i18n `scenes.<key>.labels`.
export const YARD = {
  src: '/media/cases/conteineres.webp',
  w: 1280,
  h: 720,
  /** Square crop for the case card: the lane with the reach stacker, the truck and the person. */
  square: [280, 0, 720, 720] as [number, number, number, number],
  boxes: [
    { k: 'container', b: [284, 124, 378, 308] },
    { k: 'container', b: [878, 138, 1132, 318] },
    { k: 'reachStacker', b: [548, 262, 630, 482] },
    { k: 'truck', b: [657, 348, 752, 486] },
    { k: 'person', b: [457, 500, 489, 582] },
  ] as { k: 'container' | 'reachStacker' | 'truck' | 'person'; b: [number, number, number, number] }[],
};
