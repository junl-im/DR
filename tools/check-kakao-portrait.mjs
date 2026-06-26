import { readFileSync } from 'node:fs';

const files = {
  html: readFileSync('index.html', 'utf8'),
  main: readFileSync('src/main.ts', 'utf8'),
  guard: readFileSync('src/platform/browserGuard.js', 'utf8'),
  portrait: readFileSync('src/platform/portraitLock.js', 'utf8'),
  fullscreen: readFileSync('src/platform/fullscreen.js', 'utf8'),
  viewport: readFileSync('src/platform/viewportFrame.js', 'utf8'),
  css: readFileSync('src/styles.css', 'utf8'),
  packageJson: readFileSync('package.json', 'utf8')
};
const required = [
  ['html', 'portrait-lock-overlay'],
  ['main', 'initPortraitRuntimeGuard'],
  ['main', 'requestKakaoPortraitLock'],
  ['guard', 'requestPortraitFullscreen'],
  ['portrait', 'applyPortraitFrame'],
  ['fullscreen', 'applyPortraitFrame'],
  ['viewport', 'computePortraitFrame'],
  ['viewport', 'sourceLandscape'],
  ['viewport', 'virtual-portrait'],
  ['css', 'html.source-landscape .app-shell'],
  ['css', 'body[data-viewport-frame="virtual-portrait"]'],
  ['packageJson', 'check:kakao-portrait']
];
const missing = required.filter(([file, token]) => !files[file].includes(token)).map(([file, token]) => `${file}: ${token}`);
if (missing.length) {
  console.error(`Virtual portrait frame check failed:\n${missing.join('\n')}`);
  process.exit(1);
}
if (/intent:\/\/|makeChromeIntentUrl|open-external-button|copy-url-button/.test(Object.values(files).join('\n'))) {
  console.error('External browser handoff tokens are forbidden.');
  process.exit(1);
}
console.log('Virtual portrait frame check passed.');
