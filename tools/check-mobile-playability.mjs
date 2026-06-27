import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const renderer = readFileSync('src/rendering/DreamPixiRenderer.ts', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const errors = [];

for (const token of ['board-camera-controls', 'data-camera-action="fit"', 'data-camera-action="center"', 'data-camera-action="zoom-in"', 'data-camera-action="zoom-out"']) {
  if (!html.includes(token)) errors.push(`Missing board camera control UI: ${token}`);
}
for (const token of ['handleBoardCameraControl', 'renderer.fitBoardView()', 'renderer.centerBoardView()', 'renderer.nudgeCameraZoom(1.16)', 'renderer.nudgeCameraZoom(0.86)']) {
  if (!main.includes(token)) errors.push(`Missing camera control runtime: ${token}`);
}
for (const token of ['fitBoardView(animated = true)', 'centerBoardView(animated = true)', 'nudgeCameraZoom(factor: number', 'animateCameraTo(']) {
  if (!renderer.includes(token)) errors.push(`Missing renderer camera API: ${token}`);
}
for (const token of ['.board-camera-controls', 'touch-action: manipulation', '.pixi-board-host[data-camera-mode="pan-zoom"] canvas', 'touch-action: none']) {
  if (!css.includes(token)) errors.push(`Missing mobile board style: ${token}`);
}
if (/(Display Assist|Frame Lock|Kakao Browser|Virtual Frame|Portrait Lock)/.test(html + main + css)) {
  errors.push('Developer/browser diagnostic copy must not be visible in the game UI.');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Mobile playability check passed: camera controls, touch isolation and user-facing copy are ready.');
