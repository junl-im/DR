import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const png = join(root, 'public/assets/atlas/v2-state-tiles.png');
const json = join(root, 'public/assets/atlas/v2-state-tiles.atlas.json');
const difficulty = readFileSync(join(root, 'src/game/difficulty.js'), 'utf8');
const renderer = readFileSync(join(root, 'src/rendering/DreamPixiRenderer.ts'), 'utf8');
const errors = [];

if (!existsSync(png)) errors.push('Missing packed v2 state atlas PNG.');
if (!existsSync(json)) errors.push('Missing packed v2 state atlas JSON.');
if (existsSync(png) && statSync(png).size < 1024 * 1024) errors.push('Packed v2 state atlas PNG is unexpectedly small.');
if (existsSync(json)) {
  const atlas = JSON.parse(readFileSync(json, 'utf8'));
  const frames = atlas.frames || {};
  const frameNames = Object.keys(frames);
  if (frameNames.length < 180) errors.push(`Expected at least 180 v2 state atlas frames, found ${frameNames.length}.`);
  for (const state of ['normal', 'selected', 'hint', 'locked', 'disabled']) {
    if (!frames[`v2-tile-01-${state}.png`]) errors.push(`Missing atlas frame v2-tile-01-${state}.png.`);
  }
  if (atlas.meta?.image !== 'v2-state-tiles.png') errors.push('Atlas JSON must reference v2-state-tiles.png.');
}
if (!difficulty.includes('v2-state-tiles.atlas.json')) errors.push('PRELOAD_ASSETS must include v2 state atlas JSON.');
if (!renderer.includes('atlasFrameName') || !renderer.includes('v2-state/${filename}')) errors.push('Renderer must prefer atlas frame lookup before individual PNG fallback.');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('v2 state atlas pack policy passed: packed PNG/JSON and atlas-first renderer lookup are present.');
