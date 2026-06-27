import { readFileSync } from 'node:fs';

const renderer = readFileSync('src/rendering/DreamPixiRenderer.ts', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const errors = [];

if (!renderer.includes('objectiveMarkerLayer') || !renderer.includes('refreshObjectiveMarkers') || !renderer.includes('objective-marker-layer')) {
  errors.push('Board objective markers must be rendered in a world-space overlay layer.');
}
if (!renderer.includes('view.tile.special') || !renderer.includes('!view.tile.specialRevealed')) {
  errors.push('Objective markers must prioritize unrevealed special tiles without using a minimap.');
}
if (!main.includes('space-reclaimed') || !css.includes('[data-camera-ui="space-reclaimed"]')) {
  errors.push('Large-board camera UI must be hidden while retaining camera state hooks.');
}
if (!main.includes('getBossWarningPattern') || !renderer.includes("pattern: 'column' | 'row' | 'cross' | 'diagonal'")) {
  errors.push('Boss warnings must have distinct pattern routing.');
}
if (!renderer.includes("pattern === 'diagonal'") || !renderer.includes("pattern === 'cross'") || !renderer.includes("pattern === 'row'")) {
  errors.push('Boss warning renderer must draw row, cross and diagonal variants.');
}
if (!renderer.includes('screenToWorld') || !renderer.includes('drawBossWarningLane(power, pattern')) {
  errors.push('Boss warnings must remain camera-aware in world coordinates.');
}
const runtime = `${html}\n${main}\n${renderer}\n${css}`;
for (const token of ['board-minimap', 'boardMinimap', '보드 레이더', '레이더 탭', '드래그 이동', '보기 맞춤']) {
  if (runtime.includes(token)) errors.push(`Removed UI must stay removed: ${token}`);
}
if (/Display Assist|Frame Lock|Kakao Browser|Virtual Frame|Portrait Lock|카카오 브라우저 대응/.test(runtime)) {
  errors.push('Developer/browser diagnostic copy must not be visible in the game UI.');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Objective camera boss check passed: markers and boss warnings remain active without minimap or visible camera help.');
