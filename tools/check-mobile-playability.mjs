import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const renderer = readFileSync('src/rendering/DreamPixiRenderer.ts', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const errors = [];

for (const token of ['data-camera-action="fit"', 'data-camera-action="center"', 'data-camera-action="zoom-in"', 'data-camera-action="zoom-out"', '보기 맞춤', '중앙</button>', '드래그 이동']) {
  if (html.includes(token) || main.includes(token)) errors.push(`Visible camera help/control UI must be removed: ${token}`);
}
for (const token of ['fitBoardView(animated = true)', 'centerBoardView(animated = true)', 'nudgeCameraZoom(factor: number', 'zoomAt(', 'pointermove', 'wheel']) {
  if (!renderer.includes(token)) errors.push(`Renderer camera engine must remain available internally: ${token}`);
}
for (const token of ['board-camera-shell', 'data-visible-controls="removed"', 'data-camera-ui', 'space-reclaimed']) {
  if (!(html + main + css).includes(token)) errors.push(`Missing reclaimed board camera UI hook: ${token}`);
}
for (const token of ['touch-action: none', '.pixi-board-host[data-camera-mode="pan-zoom"] canvas']) {
  if (!css.includes(token)) errors.push(`Missing mobile board touch isolation: ${token}`);
}
if (/(Display Assist|Frame Lock|Kakao Browser|Virtual Frame|Portrait Lock)/.test(html + main + css)) {
  errors.push('Developer/browser diagnostic copy must not be visible in the game UI.');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Mobile playability check passed: gesture camera remains while visible camera controls/help are removed.');
