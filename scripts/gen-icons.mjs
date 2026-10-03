// Generates public/favicon.svg, favicon.ico (32 px PNG inside ICO) and apple-touch-icon.png
// from the official symbol — the O-keyhole (src/lib/brand.ts, copied from Marca/oficial/).
// The README of the brand lists the symbol for favicons; its 20 px minimum holds at 32 px.
// Run: node scripts/gen-icons.mjs
import { writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { SYMBOL_INNER, SYMBOL_VIEWBOX } from '../src/lib/brand.ts';

const mark = (fill) => `<g class="m" fill="${fill}">${SYMBOL_INNER}</g>`;

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${SYMBOL_VIEWBOX}"><style>.m{fill:#0A0A0F}@media (prefers-color-scheme:dark){.m{fill:#F4F6F8}}</style>${mark('#0A0A0F')}</svg>\n`;
writeFileSync('public/favicon.svg', favicon);

const png = (size, bg) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${SYMBOL_VIEWBOX}" width="${size}" height="${size}">${bg ? `<rect width="100" height="100" fill="${bg}"/>` : ''}<g transform="translate(${bg ? 14 : 0} ${bg ? 14 : 0}) scale(${bg ? 0.72 : 1})">${mark('#0A0A0F')}</g></svg>`;
  return new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
};

writeFileSync('public/apple-touch-icon.png', png(180, '#F4F6F8'));

const ico32 = png(32);
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // one image
header.writeUInt8(32, 6); // width
header.writeUInt8(32, 7); // height
header.writeUInt8(0, 8); // palette
header.writeUInt8(0, 9); // reserved
header.writeUInt16LE(1, 10); // planes
header.writeUInt16LE(32, 12); // bpp
header.writeUInt32LE(ico32.length, 14); // size
header.writeUInt32LE(22, 18); // offset
writeFileSync('public/favicon.ico', Buffer.concat([header, ico32]));
console.log('icons written to public/');
