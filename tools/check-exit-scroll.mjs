import { readFileSync } from 'node:fs';

const files = {
  html: readFileSync('index.html', 'utf8'),
  main: readFileSync('src/main.ts', 'utf8'),
  portrait: readFileSync('src/platform/portraitLock.js', 'utf8'),
  css: readFileSync('src/styles.css', 'utf8'),
  packageJson: readFileSync('package.json', 'utf8')
};

const required = [
  ['html', 'exit-sleep-modal'],
  ['html', 'exit-wake-button'],
  ['main', 'showExitSleep'],
  ['main', 'wakeFromExitSleep'],
  ['main', 'dream-library-local-ranking-global'],
  ['main', 'renderLocalDailyLeaderboard'],
  ['portrait', 'isTapLikeGesture'],
  ['portrait', 'pointerdown'],
  ['css', '.exit-sleep-modal'],
  ['css', 'touch-action: pan-y'],
  ['css', '.pixi-board-host canvas'],
  ['packageJson', 'check:exit-scroll']
];

const missing = required.filter(([file, token]) => !files[file].includes(token)).map(([file, token]) => `${file}: ${token}`);
if (missing.length) {
  console.error(`Exit and scroll polish check failed:\n${missing.join('\n')}`);
  process.exit(1);
}
console.log('Exit fallback and smooth scroll policy passed.');
