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
const has = (text, token, label = token) => { if (!text.includes(token)) errors.push(`Missing ${label}`); };

if (!['1.0.69', '1.0.70', '1.0.71', '1.0.72', '1.0.73', '1.0.74', '1.0.75', '1.0.76', '1.0.77', '1.0.78', '1.0.79', '1.0.80', '1.0.81', '1.0.82', '1.0.83'].includes(pkg.version)) errors.push(`package version must be 1.0.69 or 1.0.70, got ${pkg.version}`);
for (const token of [
  'v1069-lobby-rhythm-cleanup',
  'v1069-restoration-detail-ceremony',
  'v1069-reward-popup-density-guard',
  'v1069-boss-warning-icon-set-polish',
  'v1069-clear-flow-recommendation-qa',
  'dream-library-cache-v1.0.69',
  'texture-atlas-manifest-v1.0.69.json'
]) has(index + main + css + sw + difficulty, token, `v1.0.69 token ${token}`);

has(main, 'function getBossWarningIconLabel', 'boss warning icon label mapper');
has(main, 'data-warning-icon-label', 'boss warning icon label markup');
has(main, 'restoration-ceremony-strip', 'restoration ceremony strip render');
has(main, 'reward-popup-density-tight', 'reward popup density body guard');
has(main, 'reward-next-route', 'clear flow route hint');
has(css, 'data-lobby-rhythm-density="compact"', 'compact lobby rhythm css');
has(css, 'data-goal-priority="restore-first"', 'restore-first recommendation styling');
has(css, 'data-warning-icon="clock"', 'clock icon state styling');
has(css, 'data-warning-icon="mistake"', 'mistake icon state styling');
has(sw, 'dream-library-cache-v1.0.69', 'service worker v1.0.69 cache');
has(sw, 'texture-atlas-manifest-v1.0.69.json', 'service worker v1.0.69 atlas preload');
has(difficulty, 'texture-atlas-manifest-v1.0.69.json', 'difficulty v1.0.69 atlas preload');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.69.json')) errors.push('missing v1.0.69 texture atlas manifest');
has(pages, 'npm run check:restoration-detail-ceremony', 'GitHub Pages v1.0.69 QA hook');
has(quality, 'npm run check:restoration-detail-ceremony', 'Quality v1.0.69 QA hook');
if (/signal-finger|☝/.test(index + main)) errors.push('finger start cue must stay removed from HTML/runtime');
if (/DELETE_REMOVED/i.test(index + main + css + sw)) errors.push('DELETE_REMOVED marker must not be present');
if (/\.svg\b/i.test(index + main + css + sw)) errors.push('SVG references are not allowed');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Restoration detail ceremony QA check passed: v1.0.69 improves lobby rhythm, restoration ceremony, reward density, boss icon set, and clear flow recommendation QA.');
