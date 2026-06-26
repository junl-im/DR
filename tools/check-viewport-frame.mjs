import { readFileSync } from 'node:fs';

const viewport = readFileSync('src/platform/viewportFrame.js', 'utf8');
const fullscreen = readFileSync('src/platform/fullscreen.js', 'utf8');
const portrait = readFileSync('src/platform/portraitLock.js', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const required = [
  ['viewport', 'computePortraitFrame'],
  ['viewport', 'PORTRAIT_RATIO'],
  ['viewport', 'sourceLandscape'],
  ['fullscreen', 'applyPortraitFrame'],
  ['portrait', 'applyPortraitFrame'],
  ['css', 'html.source-landscape .app-shell'],
  ['css', 'pointer-events: auto'],
  ['css', 'filter: none']
];
const files = { viewport, fullscreen, portrait, css };
const missing = required.filter(([name, token]) => !files[name].includes(token)).map(([name, token]) => `${name}: ${token}`);
if (missing.length) {
  console.error(`Viewport frame check failed:\n${missing.join('\n')}`);
  process.exit(1);
}
if (/html\.landscape-locked \.app-shell \{\n\s*pointer-events: none|html\.landscape-locked \.app-shell \{[\s\S]*?filter: blur/.test(css)) {
  console.error('Landscape fallback must not blur or disable the game shell.');
  process.exit(1);
}
console.log('Viewport frame stability check passed.');
