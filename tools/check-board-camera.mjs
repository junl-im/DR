import { readFileSync } from 'node:fs';

const difficulty = readFileSync('src/game/difficulty.js', 'utf8');
const renderer = readFileSync('src/rendering/DreamPixiRenderer.ts', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const html = readFileSync('index.html', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const runtime = `${html}\n${main}\n${css}`;

const checks = [
  [difficulty.includes("cameraMode: 'panZoom'") && difficulty.includes("rows: 12") && difficulty.includes("cols: 14"), 'Large-board difficulties must use panZoom board profiles.'],
  [renderer.includes('type BoardCamera') && renderer.includes('boardViewport') && renderer.includes('installCameraControls'), 'DreamPixiRenderer must include a board camera viewport and gesture controls.'],
  [renderer.includes('zoomAt(') && renderer.includes('pointermove') && renderer.includes('wheel'), 'Board camera must support drag, pinch and wheel zoom internally.'],
  [renderer.includes('tapSuppressedUntil') && renderer.includes('isTapSuppressed()'), 'Camera drag must suppress accidental tile taps.'],
  [html.includes('board-camera-shell') && html.includes('data-visible-controls="removed"'), 'Game screen must keep the board camera shell with visible controls removed.'],
  [main.includes('renderBoardCameraGuide') && main.includes("data-board-camera") && main.includes('space-reclaimed'), 'Runtime must keep camera mode hooks while reclaiming UI space.'],
  [css.includes('[data-camera-mode="pan-zoom"]') && css.includes('[data-camera-ui="space-reclaimed"]'), 'Styles must expose pan-zoom mode and hidden UI policy.'],
  [!/보기 맞춤|드래그 이동|두 손가락 확대\/축소|data-camera-action=/.test(runtime), 'Visible camera guide/control copy must stay removed.'],
  [!css.includes('Display Assist') && !html.includes('Display Assist') && !main.includes('Frame Lock'), 'Developer display assist copy must stay hidden.']
];

const failed = checks.find(([ok]) => !ok);
if (failed) {
  console.error(failed[1]);
  process.exit(1);
}

console.log('Board camera policy passed: engine remains, visible controls/help are removed.');
