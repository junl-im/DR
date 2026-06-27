import { readFileSync } from 'node:fs';

const renderer = readFileSync('src/rendering/DreamPixiRenderer.ts', 'utf8');
const difficulty = readFileSync('src/game/difficulty.js', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const required = [
  'readonly minReadableTile = 34',
  'const TILE_SPRITE_RATIO = 0.92',
  'sprite.width = this.tileSize * TILE_SPRITE_RATIO',
  'private fitTileSprite(view: TileView)',
  "const textureState = state === 'selected' ? 'normal' : state",
  'view.root.scale.set(1)',
  'grid-template-rows: auto minmax(360px, 1fr) auto',
  "rows: 8,\n    cols: 10"
];
const combined = `${renderer}\n${difficulty}\n${css}`;
const missing = required.filter((token) => !combined.includes(token));
if (missing.length) {
  console.error(`Tile readability policy failed. Missing: ${missing.join(', ')}`);
  process.exit(1);
}
if (/setSelected[\s\S]*?gsap\.to\(view\.root\.scale,\s*\{\s*x:\s*1\.1/.test(renderer)) {
  console.error('Selected tiles must not grow through root scale animation. Use rings/glow only.');
  process.exit(1);
}
if (/view\.sprite\.scale\.set\(state === 'selected'/.test(renderer)) {
  console.error('Selected tiles must not use enlarged sprite scale. Use normal texture plus rim glow.');
  process.exit(1);
}
console.log('Tile readability policy passed: bigger board, v2-priority tiles, fixed-size texture swaps and non-scaling selection.');
