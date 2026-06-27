import { readFileSync, statSync } from 'node:fs';

const errors = [];
for (const file of [
  'public/assets/atlas/boss-frames-v2.png',
  'public/assets/atlas/boss-frames-v2.atlas.json'
]) {
  try { statSync(file); } catch { errors.push(`Missing boss atlas file: ${file}`); }
}
try {
  const atlas = JSON.parse(readFileSync('public/assets/atlas/boss-frames-v2.atlas.json', 'utf8'));
  const frames = Object.keys(atlas.frames || {});
  for (const key of ['boss-motion-v2/frame-01.png', 'boss-motion-v2/frame-05.png', 'boss-sticker-v2/frame-08.png']) {
    if (!frames.includes(key)) errors.push(`Boss atlas missing frame: ${key}`);
  }
  if (frames.length < 18) errors.push(`Boss atlas expected at least 18 frames, found ${frames.length}`);
} catch (error) {
  errors.push(`Boss atlas JSON could not be read: ${error.message}`);
}
const difficulty = readFileSync('src/game/difficulty.js', 'utf8');
const bosses = readFileSync('src/game/bosses.js', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const sw = readFileSync('public/sw.js', 'utf8');
if (!difficulty.includes('BOSS_FRAME_ATLAS_ASSETS')) errors.push('BOSS_FRAME_ATLAS_ASSETS export missing.');
if (!difficulty.includes('boss-frames-v2.atlas.json') || !difficulty.includes('boss-frames-v2.png')) errors.push('Boss atlas must be preloaded.');
if (!bosses.includes('atlasFrames') || !bosses.includes('BOSS_ATLAS_FRAME_SETS')) errors.push('Boss atlas frame keys are not mapped.');
if (!main.includes('dataset.bossAtlasFrame') || !main.includes('BOSS_FRAME_ATLAS_ASSETS')) errors.push('Boss frame UI must expose atlas frame metadata and preload atlas.');
if (!sw.includes('boss-frames-v2.png') || !sw.includes('boss-frames-v2.atlas.json')) errors.push('Service worker must cache boss atlas files.');
if (errors.length) {
  console.error(`Boss atlas policy failed: ${errors.join('; ')}`);
  process.exit(1);
}
console.log('Boss frame atlas policy passed for v1.0.23.');
