import { existsSync, readFileSync } from 'node:fs';

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
const has = (text, token, label) => { if (!text.includes(token)) errors.push(`Missing ${label}: ${token}`); };

if (!['1.0.62', '1.0.63', '1.0.64', '1.0.65', '1.0.66', '1.0.67', '1.0.68', '1.0.69', '1.0.70', '1.0.71', '1.0.72', '1.0.73', '1.0.74', '1.0.75', '1.0.76', '1.0.77', '1.0.78', '1.0.79'].includes(pkg.version)) errors.push(`package version must be 1.0.62 or 1.0.63, got ${pkg.version}`);
if (!pkg.scripts['check:daily-start-focus-assist']) errors.push('missing package script check:daily-start-focus-assist');
for (const token of ['v1062-daily-start-focus-assist', 'v1062-lobby-guide-comfort', 'v1062-boss-intro-preload']) {
  has(index, token, 'index v1.0.62 token');
  has(main, token, 'main v1.0.62 token');
  has(css, token, 'css v1.0.62 token');
}
has(index, 'id="daily-start-focus-summary"', 'daily focus summary element');
has(main, 'function initDailyStartFocusAssistWatcher()', 'daily focus assist watcher');
has(main, 'function syncDailyStartFocusAssist()', 'daily focus assist sync');
has(main, "document.body.dataset.dailyStartGuideMode = guideMode", 'guide mode body dataset');
has(main, "beam.dataset.railMode = rerouted ? 'rerouted'", 'daily rail reroute integrity mode');
has(main, "document.body.dataset.dailyStartRailIntegrity", 'daily rail integrity dataset');
has(main, "data-boss-intro-preload", 'boss intro preload hook');
has(css, '.daily-start-focus-summary[data-daily-start-focus="v1062-daily-start-focus-assist"]', 'daily focus summary CSS');
has(css, 'body[data-daily-start-guide-mode="quiet"]', 'quiet returning guide CSS');
has(css, 'body[data-daily-start-guide-mode="micro"]', 'micro guide CSS');
has(css, '.daily-start-beam[data-rail-mode="rerouted"]', 'rerouted beam CSS');
has(css, '.boss-lane[data-boss-intro-preload="v1062-boss-intro-preload"]::before', 'boss intro preload CSS');
has(sw, 'dream-library-cache-v1.0.62', 'service worker v1.0.62 cache');
has(sw, 'texture-atlas-manifest-v1.0.62.json', 'service worker v1.0.62 atlas preload');
has(difficulty, 'texture-atlas-manifest-v1.0.62.json', 'difficulty v1.0.62 atlas preload');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.62.json')) errors.push('missing v1.0.62 texture atlas manifest');
has(pages, 'npm run check:daily-start-focus-assist', 'GitHub Pages v1.0.62 QA hook');
has(quality, 'npm run check:daily-start-focus-assist', 'Quality v1.0.62 QA hook');
for (const forbidden of ['<svg', 'DELETE_REMOVED', 'Display Assist', 'Frame Lock', 'Virtual Frame', 'Kakao Browser', '보기 맞춤', '중앙으로']) {
  if (index.includes(forbidden) || main.includes(forbidden) || css.includes(forbidden)) errors.push(`forbidden token remains: ${forbidden}`);
}
if (main.includes('requestFullscreen()') || main.includes('screen.orientation.lock(')) errors.push('automatic fullscreen/orientation lock must not be added');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Daily start focus assist QA check passed: v1.0.62 guide comfort, rail reroute integrity and boss intro preload polish are wired.');
