import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const renderer = readFileSync('src/rendering/DreamPixiRenderer.ts', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const errors = [];

for (const token of ['board-minimap', 'board-minimap-map', '보드 레이더']) {
  if (!html.includes(token)) errors.push(`Missing minimap UI token: ${token}`);
}
for (const token of ['boardMinimap', '레이더 탭', 'renderer.hint(points, routePath)', 'findConnectionPath(state.board, points[0], points[1])']) {
  if (!main.includes(token)) errors.push(`Missing route/minimap runtime token: ${token}`);
}
for (const token of ['refreshBoardMinimap', 'updateBoardMinimapViewport', 'installMinimapControls', 'focusBoardPoints', 'drawRouteAssist', 'drawBossWarningLane', 'screenToWorld']) {
  if (!renderer.includes(token)) errors.push(`Missing renderer engine upgrade token: ${token}`);
}
for (const token of ['.board-minimap', '.board-minimap-dot', '.board-minimap-viewport', 'touch-action: manipulation']) {
  if (!css.includes(token)) errors.push(`Missing minimap style token: ${token}`);
}
if (/Display Assist|Frame Lock|Kakao Browser|Virtual Frame|Portrait Lock|카카오 브라우저 대응/.test(html + main + css)) {
  errors.push('Developer/browser diagnostic copy must not be visible in the game UI.');
}
if (/hint\(points: BoardPoint\[\]\) \{/.test(renderer)) {
  errors.push('Hint API must accept route path data for route assist preview.');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Minimap, route assist and boss camera impact check passed.');
