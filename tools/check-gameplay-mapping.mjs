import { readFileSync } from 'node:fs';

const difficulty = readFileSync('src/game/difficulty.js', 'utf8');
const shisen = readFileSync('src/game/shisen.js', 'utf8');
const renderer = readFileSync('src/rendering/DreamPixiRenderer.ts', 'utf8');
const viewport = readFileSync('src/platform/viewportFrame.js', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');

const failures = [];
if (!/export function getGameplayTilePool/.test(difficulty)) failures.push('difficulty.js must expose getGameplayTilePool.');
if (!/const v2Tiles = TILE_SET\.filter\(\(tile\) => tile\.stateAssets\)/.test(difficulty)) failures.push('Gameplay pool must prioritize v2 state tiles.');
if (!/import \{ getGameplayTilePool \}/.test(shisen) || !/getGameplayTilePool\(difficulty\)/.test(shisen)) failures.push('Board creation must use the v2-priority gameplay pool.');
if (!/selectionRing/.test(renderer) || !/emitSelectionSpark/.test(renderer)) failures.push('Renderer must show strong selected state ring and spark.');
if (/rotate\(var\(--portrait-rotation\)\)/.test(css) && !/html\.counter-rotated-portrait \.app-shell \{\n\s*transform: none !important;/.test(css)) failures.push('Counter rotation must be disabled by final CSS override.');
if (!/counterRotated: false/.test(viewport)) failures.push('Viewport frame must not counter-rotate the UI.');
if (!/html\.source-landscape \.app-shell/.test(css) || !/place-items: center/.test(css)) failures.push('Landscape source viewport must fit a centered portrait app shell.');
if (!/body\[data-screen="lobby"\] \.screen-lobby/.test(css) || !/touch-action: pan-y/.test(css)) failures.push('Lobby scroll must allow pan-y.');

if (failures.length) {
  console.error(`Gameplay mapping check failed:\n${failures.join('\n')}`);
  process.exit(1);
}
console.log('Gameplay mapping check passed: v2 tiles first, selection visible, portrait fit stable, lobby scroll enabled.');
