import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const errors = [];
const root = process.cwd();
const states = ['normal', 'selected', 'hint', 'locked', 'disabled'];
for (let index = 1; index <= 36; index += 1) {
  const id = `v2-tile-${String(index).padStart(2, '0')}`;
  for (const state of states) {
    const file = join(root, 'public', 'assets', 'objects', 'v2-state', `${id}-${state}.png`);
    if (!existsSync(file)) errors.push(`Missing ${id} ${state} tile state PNG.`);
  }
}
for (const file of [
  'public/assets/backgrounds/moon-library-v2.png',
  'public/assets/characters/mascot-scholar-v2.png',
  'public/assets/characters/boss-motion-sheet-v2.png',
  'public/assets/ui/logo-dream-library-v2.png',
  'public/assets/meta/asset-import-v1.0.17.json',
  'public/assets/atlas/v2-state-tiles.png',
  'public/assets/atlas/v2-state-tiles.atlas.json'
]) {
  if (!existsSync(join(root, file))) errors.push(`Missing v1.0.17+ imported asset: ${file}`);
}
const difficulty = readFileSync(join(root, 'src', 'game', 'difficulty.js'), 'utf8');
const shisen = readFileSync(join(root, 'src', 'game', 'shisen.js'), 'utf8');
if (!/stateAssets:\s*stateTileSet\('v2-tile-01'\)/.test(difficulty)) errors.push('TILE_SET does not expose v2 stateAssets.');
if (!/GAMEPLAY_TILE_SET/.test(difficulty) || !/function\s+getGameplayTiles/.test(difficulty)) errors.push('Gameplay tile pool helper is missing.');
if (!/theme === 'v2 에셋'/.test(difficulty)) errors.push('Gameplay tile pool must prioritize v2 assets.');
if (!/getGameplayTiles\(difficulty\.iconTypes\)/.test(shisen)) errors.push('Board creation must use the v2-priority gameplay tile pool.');
if (!/flatMap\(\(tile\) => tile\.stateAssets/.test(difficulty)) errors.push('PRELOAD_ASSETS must preload tile state assets.');
if (!/v2-state-tiles\.atlas\.json/.test(difficulty)) errors.push('PRELOAD_ASSETS must preload the packed v2 tile atlas.');
const renderer = readFileSync(join(root, 'src', 'rendering', 'DreamPixiRenderer.ts'), 'utf8');
if (!/applyTileStateTexture/.test(renderer) || !/emitTileFragments/.test(renderer)) errors.push('Renderer must apply tile state textures and fragments.');
if (!/atlasFrameName/.test(renderer)) errors.push('Renderer must try atlas frame lookup before individual tile PNG fallback.');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('v2 asset state policy passed: state tiles, v2-priority gameplay pool and atlas-first renderer bindings are present.');
