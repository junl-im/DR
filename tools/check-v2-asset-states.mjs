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
  'public/assets/meta/asset-import-v1.0.17.json'
]) {
  if (!existsSync(join(root, file))) errors.push(`Missing v1.0.17 imported asset: ${file}`);
}
const difficulty = readFileSync(join(root, 'src', 'game', 'difficulty.js'), 'utf8');
if (!/stateAssets:\s*stateTileSet\('v2-tile-01'\)/.test(difficulty)) errors.push('TILE_SET does not expose v2 stateAssets.');
if (!/export function getGameplayTilePool/.test(difficulty)) errors.push('Gameplay tile pool helper is missing.');
if (!/flatMap\(\(tile\) => tile\.stateAssets/.test(difficulty)) errors.push('PRELOAD_ASSETS must preload tile state assets.');
const shisen = readFileSync(join(root, 'src', 'game', 'shisen.js'), 'utf8');
if (!/getGameplayTilePool\(difficulty\)/.test(shisen)) errors.push('Board creation must use the v2-priority gameplay tile pool.');
const renderer = readFileSync(join(root, 'src', 'rendering', 'DreamPixiRenderer.ts'), 'utf8');
if (!/applyTileStateTexture/.test(renderer) || !/emitTileFragments/.test(renderer)) errors.push('Renderer must apply tile state textures and fragments.');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('v2 asset state policy passed: state tiles, hero assets and renderer bindings are present.');
