import { readFileSync } from 'node:fs';

const runtimeFiles = ['index.html', 'src/main.ts', 'src/platform/browserGuard.js', 'src/platform/portraitLock.js', 'src/styles.css'];
const forbidden = [
  'Display Assist',
  'Frame Lock',
  '게임 화면을 준비했습니다',
  '게임 화면을 맞출 준비',
  '게임 프레임 유지 중',
  '게임 화면은 같은 비율',
  '프레임 정리',
  '화면 다시 맞춤',
  '전투 레이어 동기화'
];
const combined = runtimeFiles.map((file) => readFileSync(file, 'utf8')).join('\n');
const found = forbidden.filter((token) => combined.includes(token));
if (found.length) {
  console.error(`Display helper copy must stay silent. Found: ${found.join(', ')}`);
  process.exit(1);
}
for (const id of ['browser-guard', 'guard-status', 'kakao-fullscreen-button', 'kakao-portrait-button', 'continue-inapp-button', 'portrait-lock-overlay', 'portrait-lock-action-button', 'portrait-lock-continue-button']) {
  if (!combined.includes(id)) {
    console.error(`Silent display hook missing: ${id}`);
    process.exit(1);
  }
}
console.log('Display helper copy policy passed. Runtime frame hooks are silent.');
