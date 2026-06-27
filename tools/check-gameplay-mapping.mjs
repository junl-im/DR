import fs from 'node:fs';

const shisen = fs.readFileSync('src/game/shisen.js', 'utf8');
const difficulty = fs.readFileSync('src/game/difficulty.js', 'utf8');
const renderer = fs.readFileSync('src/rendering/DreamPixiRenderer.ts', 'utf8');
const styles = fs.readFileSync('src/styles.css', 'utf8');

const required = [
  [difficulty.includes('GAMEPLAY_TILE_SET'), 'GAMEPLAY_TILE_SET must exist'],
  [difficulty.includes("theme === 'v2 에셋'"), 'v2 assets must be prioritized'],
  [shisen.includes('getGameplayTiles(difficulty.iconTypes)'), 'board generation must use gameplay tile mapping'],
  [renderer.includes('selectionRing') && renderer.includes('selectionCore'), 'selection visibility ring/core must exist'],
  [styles.includes('v2 오브젝트 우선 배정'), 'lobby selected card must disclose v2 gameplay mapping']
];

const failed = required.filter(([ok]) => !ok).map(([, message]) => message);
if (failed.length) {
  console.error(failed.join('\n'));
  process.exit(1);
}
console.log('Gameplay mapping and selection clarity checks passed.');
