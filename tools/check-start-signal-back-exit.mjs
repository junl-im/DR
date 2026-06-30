import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const read = (path) => readFileSync(path, 'utf8');
const pkg = JSON.parse(read('package.json'));
const main = read('src/main.ts');
const css = read('src/styles.css');
const index = read('index.html');
const sw = read('public/sw.js');
const difficulty = read('src/game/difficulty.js');
const workflows = ['.github/workflows/github-pages.yml', '.github/workflows/quality-check.yml'].map(read).join('\n');
const errors = [];
const has = (text, token, label) => { if (!text.includes(token)) errors.push(`missing ${label}: ${token}`); };

if (!['1.0.57', '1.0.58', '1.0.59', '1.0.60', '1.0.61', '1.0.62', '1.0.63', '1.0.64', '1.0.65', '1.0.66', '1.0.67', '1.0.68', '1.0.69', '1.0.70'].includes(pkg.version)) errors.push(`package version must be 1.0.57 or 1.0.58, got ${pkg.version}`);
for (const token of ['v1057-daily-start-signal-widget', 'v1057-back-action-sheet-restored', 'v1057-mobile-exit-options-qa']) {
  has(main, token, 'main v1.0.57 token');
  has(css, token, 'css v1.0.57 token');
  has(index, token, 'index v1.0.57 token');
}
has(index, 'id="daily-start-signal"', 'floating daily start signal widget');
has(index, 'signal-arrow', 'floating arrow cue');
has(index, '게임 시작', 'game start bubble copy');
has(index, 'id="exit-home-button"', 'exit action sheet home button');
has(index, 'id="exit-options-button"', 'exit action sheet gear button');
has(index, 'id="exit-confirm-button"', 'exit action sheet exit button');
has(main, 'function exitHomeFromBackSheet', 'first screen exit sheet handler');
has(main, 'openExitConfirm();\n    return;', 'soft back opens action sheet');
has(css, '@keyframes startGuideFloat', 'floating start guide animation');
has(css, '.exit-sheet-actions', 'exit action sheet layout');
has(sw, 'dream-library-cache-v1.0.57', 'service worker v1.0.57 cache');
has(sw, 'texture-atlas-manifest-v1.0.57.json', 'service worker v1.0.57 atlas preload');
has(difficulty, 'texture-atlas-manifest-v1.0.59.json', 'difficulty current atlas preload');
has(workflows, 'check:start-signal-back-exit', 'workflow v1.0.57 check hook');
if (!existsSync(join('public', 'assets', 'meta', 'texture-atlas-manifest-v1.0.57.json'))) errors.push('missing v1.0.57 texture atlas manifest');
if (index.includes('<svg') || css.includes('<svg') || main.includes('<svg')) errors.push('SVG markup is forbidden');
if (main.includes('requestFullscreen()') || main.includes('screen.orientation.lock(')) errors.push('automatic fullscreen/orientation lock must not be added');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Start signal and back exit QA check passed: v1.0.57+ daily start cue and mobile back action sheet are active.');
