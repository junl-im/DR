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
if (html.includes('<header class="topbar') || html.includes('class="topbar-spacer"') || html.includes('class="top-actions"')) {
  errors.push('Visible topbar/action line must be removed from HTML.');
}
for (const token of ['retired-shell-actions', 'id="back-button"', 'id="open-settings-button"', '#back-button']) {
  if (runtime.includes(token)) errors.push(`Deleted shell action compatibility token came back: ${token}`);
}
if (!html.includes('id="exit-options-button"') || !main.includes('openOptionsFromExitSheet')) {
  errors.push('Back/exit sheet must include the gear options entry.');
}
if (!renderer.includes('drawRouteAssist') || !renderer.includes('drawBossWarningLane') || !renderer.includes('screenToWorld')) {
  errors.push('Route assist and boss camera impact must stay even after minimap/topbar removal.');
}
if (/Display Assist|Frame Lock|Kakao Browser|Virtual Frame|Portrait Lock|카카오 브라우저 대응/.test(runtime)) {
  errors.push('Developer/browser diagnostic copy must not be visible in the game UI.');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('No-minimap/topbar check passed: minimap, visible top option line and retired shell action mounts are removed while back-sheet options remain.');
