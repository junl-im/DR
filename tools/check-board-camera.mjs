import { readFileSync } from 'node:fs';

const difficulty = readFileSync('src/game/difficulty.js', 'utf8');
const renderer = readFileSync('src/rendering/DreamPixiRenderer.ts', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const html = readFileSync('index.html', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');

const checks = [
  [difficulty.includes("cameraMode: 'panZoom'") && difficulty.includes("rows: 12") && difficulty.includes("cols: 14"), 'Large-board difficulties must use panZoom board profiles.'],
  [renderer.includes('type BoardCamera') && renderer.includes('boardViewport') && renderer.includes('installCameraControls'), 'DreamPixiRenderer must include a board camera viewport and controls.'],
  [renderer.includes('zoomAt(') && renderer.includes('pointermove') && renderer.includes('wheel'), 'Board camera must support drag, pinch and wheel zoom controls.'],
  [renderer.includes('tapSuppressedUntil') && renderer.includes('isTapSuppressed()'), 'Camera drag must suppress accidental tile taps.'],
  [html.includes('board-camera-shell') && html.includes('board-camera-guide'), 'Game screen must include an unobtrusive board camera guide.'],
  [main.includes('renderBoardCameraGuide') && main.includes("data-board-camera"), 'Runtime must toggle board camera guide and stage camera mode.'],
  [css.includes('[data-camera-mode="pan-zoom"]') && main.includes('두 손가락'), 'Styles must expose pan-zoom mode and guide copy.'],
  [!css.includes('Display Assist') && !html.includes('Display Assist') && !main.includes('Frame Lock'), 'Developer display assist copy must stay hidden.']
];

const failed = checks.find(([ok]) => !ok);
if (failed) {
  console.error(failed[1]);
  process.exit(1);
}

console.log('Board camera and large-map playability policy passed.');
