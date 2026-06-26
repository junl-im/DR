import { readFileSync } from 'node:fs';

const files = {
  html: readFileSync('index.html', 'utf8'),
  main: readFileSync('src/main.ts', 'utf8'),
  guard: readFileSync('src/platform/browserGuard.js', 'utf8'),
  portrait: readFileSync('src/platform/portraitLock.js', 'utf8'),
  css: readFileSync('src/styles.css', 'utf8'),
  packageJson: readFileSync('package.json', 'utf8')
};
const required = [
  ['html', 'portrait-lock-overlay'],
  ['html', 'kakao-fullscreen-button'],
  ['main', 'initPortraitRuntimeGuard'],
  ['main', 'requestKakaoPortraitLock'],
  ['guard', 'requestPortraitFullscreen'],
  ['portrait', 'screen.orientation?.lock'],
  ['portrait', '--app-height'],
  ['css', 'html.kakao-runtime'],
  ['css', '.portrait-lock-overlay'],
  ['packageJson', 'check:kakao-portrait']
];
const missing = required.filter(([file, token]) => !files[file].includes(token)).map(([file, token]) => `${file}: ${token}`);
if (missing.length) {
  console.error(`Kakao portrait check failed:\n${missing.join('\n')}`);
  process.exit(1);
}
if (/intent:\/\/|makeChromeIntentUrl|open-external-button|copy-url-button/.test(Object.values(files).join('\n'))) {
  console.error('External browser handoff tokens are forbidden in v1.0.17.');
  process.exit(1);
}
console.log('Kakao portrait fullscreen lock check passed.');
