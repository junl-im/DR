import { existsSync, readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const index = read('index.html');
const main = read('src/main.ts');
const css = read('src/styles.css');
const sw = read('public/sw.js');
const difficulty = read('src/game/difficulty.js');
const pkg = JSON.parse(read('package.json'));
const workflows = ['.github/workflows/github-pages.yml', '.github/workflows/quality-check.yml'].map(read).join('\n');
const errors = [];
const has = (text, token, label) => { if (!text.includes(token)) errors.push(`Missing ${label}: ${token}`); };

if (!['1.0.61', '1.0.62', '1.0.63', '1.0.64', '1.0.65', '1.0.66', '1.0.67', '1.0.68', '1.0.69', '1.0.70', '1.0.71', '1.0.72', '1.0.73', '1.0.74', '1.0.75', '1.0.76', '1.0.77', '1.0.78', '1.0.79', '1.0.80', '1.0.81', '1.0.82', '1.0.83', '1.0.85'].includes(pkg.version)) errors.push(`package version must be 1.0.61, got ${pkg.version}`);
for (const token of ['v1061-daily-start-precision-rail', 'v1061-lobby-content-guide', 'v1061-daily-reward-drama', 'v1061-boss-intro-polish']) {
  has(index, token, 'index v1.0.61 token');
  has(main, token, 'main v1.0.61 token');
  has(css, token, 'css v1.0.61 token');
}
has(index, 'id="daily-start-beam"', 'runtime calibrated daily start beam element');
has(index, 'id="daily-start-guide"', 'lobby content guide element');
has(index, 'id="daily-reward-promise"', 'daily reward promise element');
has(index, 'id="boss-intro-banner"', 'boss intro banner element');
has(main, 'function syncDailyStartPrecisionRail()', 'runtime rail calibration function');
has(main, 'scheduleDailyStartPrecisionRailMeasure()', 'daily rail measure scheduler');
has(main, '--daily-rail-length', 'daily rail length CSS variable sync');
has(main, 'showBossIntroBanner(stage)', 'boss intro call on stage start');
has(main, 'daily.rewardBoost', 'daily reward boost preview in promise');
has(css, '.daily-start-beam[data-daily-start-precision="v1061-daily-start-precision-rail"]', 'daily beam CSS');
has(css, '.daily-start-guide[data-lobby-content-guide="v1061-lobby-content-guide"]', 'daily start guide CSS');
has(css, '.daily-reward-promise[data-daily-reward-drama="v1061-daily-reward-drama"]', 'daily reward promise CSS');
has(css, '.boss-intro-banner[data-boss-intro-polish="v1061-boss-intro-polish"]', 'boss intro CSS');
has(sw, 'dream-library-cache-v1.0.61', 'service worker v1.0.61 cache');
has(sw, 'texture-atlas-manifest-v1.0.61.json', 'service worker v1.0.61 atlas preload');
has(difficulty, 'texture-atlas-manifest-v1.0.61.json', 'difficulty v1.0.61 atlas preload');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.61.json')) errors.push('missing v1.0.61 texture atlas manifest');
has(workflows, 'npm run check:daily-start-precision-rail', 'workflow v1.0.61 check');
for (const banned of ['Display Assist', 'Frame Lock', 'Virtual Frame', 'Kakao Browser', 'Portrait Lock', 'DELETE_REMOVED']) {
  if (index.includes(banned) || main.includes(banned) || css.includes(banned)) errors.push(`Banned user-facing/dev token found: ${banned}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Daily start precision rail QA check passed: v1.0.61 runtime beam, lobby guide, reward promise and boss intro polish are wired.');
