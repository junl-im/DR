import { readFileSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const pkg = JSON.parse(read('package.json'));
const index = read('index.html');
const main = read('src/main.ts');
const css = read('src/styles.css');
const sw = read('public/sw.js');
const difficulty = read('src/game/difficulty.js');
const pages = read('.github/workflows/github-pages.yml');
const quality = read('.github/workflows/quality-check.yml');
const errors = [];
const has = (text, token, label) => { if (!text.includes(token)) errors.push(`missing ${label}: ${token}`); };

if (!['1.0.59', '1.0.60', '1.0.61', '1.0.62', '1.0.63', '1.0.64', '1.0.65', '1.0.66', '1.0.67', '1.0.68', '1.0.69', '1.0.70', '1.0.71', '1.0.72', '1.0.73', '1.0.74', '1.0.75', '1.0.76', '1.0.77', '1.0.78', '1.0.79', '1.0.80', '1.0.81', '1.0.82', '1.0.83'].includes(pkg.version)) errors.push(`package version must be 1.0.59, got ${pkg.version}`);
if (!pkg.scripts['check:start-coach-overlap']) errors.push('missing package script check:start-coach-overlap');

for (const token of ['v1059-smart-start-coach-overlap-qa', 'v1059-back-sheet-clarity-touch-qa', 'v1059-lobby-polish-layering']) {
  has(index, token, 'index v1.0.59 token');
  has(main, token, 'main v1.0.59 token');
  has(css, token, 'css v1.0.59 token');
}

has(index, 'class="daily-route-ribbon start-focus-rail"', 'start focus rail route ribbon');
has(index, 'data-start-coach-overlap="v1059-smart-start-coach-overlap-qa"', 'start coach overlap data hook');
has(index, 'data-back-sheet-clarity="v1059-back-sheet-clarity-touch-qa"', 'back sheet clarity modal hook');
has(main, 'function initStartCoachOverlapWatcher', 'start coach overlap watcher');
has(main, 'function scheduleStartCoachOverlapMeasure', 'start coach measure scheduler');
has(main, 'function measureStartCoachOverlap', 'start coach overlap measurement');
has(main, 'daily-start-overlap-safe', 'compact overlap body class');
has(main, 'DAILY_START_COACH_SEEN_KEY', 'start coach seen storage key');
has(main, 'writeText(DAILY_START_COACH_SEEN_KEY, START_COACH_SMART_OVERLAP_PATCH)', 'start coach seen persistence');
has(css, 'body.daily-start-overlap-safe', 'compact overlap CSS guard');
has(css, 'body.daily-start-coach-seen', 'returning player gentle coach state');
has(css, '.reward-modal[data-back-sheet-clarity="v1059-back-sheet-clarity-touch-qa"]', 'back sheet clarity CSS');
has(sw, 'dream-library-cache-v1.0.59', 'service worker v1.0.59 cache');
has(sw, 'texture-atlas-manifest-v1.0.59.json', 'service worker v1.0.59 atlas preload');
has(difficulty, 'texture-atlas-manifest-v1.0.59.json', 'difficulty v1.0.59 atlas preload');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.59.json')) errors.push('missing v1.0.59 texture atlas manifest');
has(pages, 'npm run check:start-coach-overlap', 'GitHub Pages start coach QA hook');
has(quality, 'npm run check:start-coach-overlap', 'Quality start coach QA hook');

for (const forbidden of ['<svg', 'DELETE_REMOVED', 'Display Assist', 'Frame Lock', 'Virtual Frame', 'Kakao Browser', '보기 맞춤', '중앙으로']) {
  if (index.includes(forbidden) || main.includes(forbidden) || css.includes(forbidden)) errors.push(`forbidden token remains: ${forbidden}`);
}
if (main.includes('requestFullscreen()') || main.includes('screen.orientation.lock(')) errors.push('automatic fullscreen/orientation lock must not be added');

if (errors.length) {
  console.error(`Start coach overlap QA check failed: ${errors.join('; ')}`);
  process.exit(1);
}
console.log('Start coach overlap QA check passed: v1.0.59 smart start coach, compact overlap guard and back sheet clarity are active.');
