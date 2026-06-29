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

if (!['1.0.58', '1.0.59', '1.0.60', '1.0.61', '1.0.62', '1.0.63'].includes(pkg.version)) errors.push(`package version must be 1.0.58 or 1.0.59, got ${pkg.version}`);
if (!pkg.scripts['check:daily-route-assist']) errors.push('missing package script check:daily-route-assist');

for (const token of ['v1058-daily-start-route-assist', 'v1058-back-sheet-option-row-qa', 'v1058-lobby-hero-safe-motion']) {
  has(index, token, 'index v1.0.58 token');
  has(main, token, 'main v1.0.58 token');
  has(css, token, 'css v1.0.58 token');
}

has(index, 'id="daily-start-signal" type="button"', 'clickable daily start signal button');
has(index, 'id="daily-route-ribbon"', 'daily route ribbon');
has(index, 'id="exit-options-row-button"', 'exit sheet full-width options button');
has(main, 'el.dailyStartSignal.addEventListener(\'click\', startDailyStage)', 'daily signal click starts daily stage');
has(main, 'function scheduleDailyStartNudge', 'idle nudge scheduler');
has(main, 'function markDailyStartSignalConsumed', 'start signal consumed guard');
has(main, 'el.exitOptionsRowButton.addEventListener(\'click\', openOptionsFromExitSheet)', 'exit option row listener');
has(css, 'body.daily-start-nudge-ready', 'idle nudge CSS state');
has(css, '@keyframes startWidgetAura', 'start widget aura animation');
has(css, '@keyframes startSignalNudge', 'start signal nudge animation');
has(css, '.option-row-button', 'exit option row styling');
has(sw, 'dream-library-cache-v1.0.58', 'service worker v1.0.58 cache');
has(sw, 'texture-atlas-manifest-v1.0.58.json', 'service worker v1.0.58 atlas preload');
has(difficulty, 'texture-atlas-manifest-v1.0.59.json', 'difficulty current atlas preload');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.58.json')) errors.push('missing v1.0.58 texture atlas manifest');
has(pages, 'npm run check:daily-route-assist', 'GitHub Pages daily route QA hook');
has(quality, 'npm run check:daily-route-assist', 'Quality daily route QA hook');

for (const forbidden of ['<svg', 'DELETE_REMOVED', 'Display Assist', 'Frame Lock', 'Virtual Frame', 'Kakao Browser', '보기 맞춤', '중앙으로']) {
  if (index.includes(forbidden) || main.includes(forbidden) || css.includes(forbidden)) errors.push(`forbidden token remains: ${forbidden}`);
}
if (main.includes('requestFullscreen()') || main.includes('screen.orientation.lock(')) errors.push('automatic fullscreen/orientation lock must not be added');

if (errors.length) {
  console.error(`Daily route assist QA check failed: ${errors.join('; ')}`);
  process.exit(1);
}
console.log('Daily route assist QA check passed: v1.0.58 clickable start cue, idle nudge and back sheet option row are active.');
