import { readFileSync, statSync } from 'node:fs';

const jsonPath = 'public/assets/atlas/v2-tiles.atlas.json';
const pngPath = 'public/assets/atlas/v2-tiles.png';
const atlas = JSON.parse(readFileSync(jsonPath, 'utf8'));
const png = statSync(pngPath);
const frames = Object.keys(atlas.frames || {});
const required = [
  'v2-tile-01-normal.png',
  'v2-tile-01-selected.png',
  'v2-tile-12-hint.png',
  'v2-tile-24-locked.png',
  'v2-tile-36-disabled.png'
];
const missing = required.filter((name) => !frames.includes(name));
if (missing.length) throw new Error(`Missing atlas frames: ${missing.join(', ')}`);
if (frames.length < 180) throw new Error(`Expected at least 180 v2 tile frames, found ${frames.length}`);
if (png.size < 100000) throw new Error('v2 atlas PNG looks too small.');
console.log(`Real v2 atlas check passed with ${frames.length} frames.`);
