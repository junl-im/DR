import { readFileSync } from 'node:fs';

const css = readFileSync('src/styles.css', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const viewport = readFileSync('src/platform/viewportFrame.js', 'utf8');
const required = [
  [css.includes('body[data-screen="lobby"] .screen-stack'), 'lobby stack must allow pan-y'],
  [css.includes('touch-action: manipulation'), 'tap controls must use manipulation touch action'],
  [main.includes('scrollLobbyTarget'), 'manual lobby scroll helper missing'],
  [viewport.includes('fittedLandscape'), 'viewport frame must expose fitted landscape mode'],
  [css.includes('html.source-landscape body::before'), 'landscape side matting missing']
];
const failed = required.filter(([ok]) => !ok).map(([, msg]) => msg);
if (failed.length) {
  console.error(failed.join('\n'));
  process.exit(1);
}
console.log('Touch and landscape QA check passed.');
