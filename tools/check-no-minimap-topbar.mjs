import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const renderer = readFileSync('src/rendering/DreamPixiRenderer.ts', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const errors = [];

const runtime = `${html}\n${main}\n${renderer}\n${css}`;
for (const token of ['board-minimap', 'boardMinimap', 'installMinimapControls', 'refreshBoardMinimap', 'updateBoardMinimapViewport', '보드 레이더', '레이더 탭']) {
  if (runtime.includes(token)) errors.push(`Minimap runtime must be removed: ${token}`);
}
if (html.includes('<span>꿈의 서고</span>') || html.includes('class="brand-mark"') || html.includes('class="brand-lockup"')) {
  errors.push('Topbar brand text/icon must be removed. Login title art may remain.');
}
if (!html.includes('class="topbar-spacer"') || !css.includes('.topbar-spacer')) {
  errors.push('Topbar needs a neutral spacer after removing the brand lockup.');
}
if (!renderer.includes('drawRouteAssist') || !renderer.includes('drawBossWarningLane') || !renderer.includes('screenToWorld')) {
  errors.push('Route assist and boss camera impact must stay even after minimap removal.');
}
if (/Display Assist|Frame Lock|Kakao Browser|Virtual Frame|Portrait Lock|카카오 브라우저 대응/.test(runtime)) {
  errors.push('Developer/browser diagnostic copy must not be visible in the game UI.');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('No-minimap topbar check passed: minimap and topbar brand UI are removed while route/boss camera polish remains.');
