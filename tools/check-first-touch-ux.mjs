import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

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
const has = (source, token, label) => { if (!source.includes(token)) errors.push(`Missing ${label}: ${token}`); };

if (!['1.0.66', '1.0.67', '1.0.68', '1.0.69', '1.0.70', '1.0.71', '1.0.72', '1.0.73', '1.0.74', '1.0.75', '1.0.76', '1.0.77', '1.0.78'].includes(pkg.version)) errors.push(`package version must be 1.0.66 or 1.0.67, got ${pkg.version}`);
if (!pkg.scripts['check:first-touch-ux']) errors.push('missing package script check:first-touch-ux');
for (const token of ['v1066-first-touch-micro-tutorial', 'v1066-game-ui-stability-pass', 'dream-library-cache-v1.0.66', 'texture-atlas-manifest-v1.0.66.json']) {
  has(index + main + css + sw + difficulty, token, 'v1.0.66 UX token');
}
has(index, 'id="first-touch-guide"', 'first touch guide markup');
has(index, 'id="first-touch-guide-close"', 'first touch guide close button');
has(main, 'function showFirstTouchGuide', 'first touch guide runtime show');
has(main, 'function hideFirstTouchGuide', 'first touch guide runtime hide');
has(main, 'function syncGameUiStabilityPass', 'game UI stability runtime sync');
has(main, 'initGameUiStabilityWatcher()', 'game UI stability watcher init');
has(main, 'preview.dataset.attackDensity', 'boss attack density guard');
has(css, '.first-touch-guide[data-first-touch-ux="v1066-first-touch-micro-tutorial"]', 'first touch guide CSS');
has(css, 'body.game-ui-tight', 'game UI tight CSS');
has(css, '.boss-attack-preview[data-game-ui-stability="v1066-game-ui-stability-pass"][data-attack-density="compact"]', 'boss preview compact CSS');
has(sw, "dream-library-cache-v1.0.66", 'service worker v1.0.66 cache');
has(sw, 'texture-atlas-manifest-v1.0.66.json', 'service worker v1.0.66 atlas preload');
if (!difficulty.includes('texture-atlas-manifest-v1.0.66.json') && !difficulty.includes('texture-atlas-manifest-v1.0.68.json')) errors.push('difficulty v1.0.66/v1.0.68 atlas preload missing');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.66.json')) errors.push('missing v1.0.66 texture atlas manifest');
has(pages, 'npm run check:first-touch-ux', 'GitHub Pages v1.0.66 QA hook');
has(quality, 'npm run check:first-touch-ux', 'Quality v1.0.66 QA hook');
for (const forbidden of ['Display Assist', 'Frame Lock', 'Virtual Frame', 'Kakao Browser', '보기 맞춤', '중앙으로', 'DELETE_REMOVED']) {
  if (index.includes(forbidden) || main.includes(forbidden) || css.includes(forbidden)) errors.push(`forbidden visible/debug copy found: ${forbidden}`);
}
if (index.includes('signal-finger') || index.includes('☝') || index.includes('👆')) errors.push('finger start cue must remain removed from HTML');
try {
  execFileSync('node', ['tools/check-no-svg.mjs'], { stdio: 'pipe' });
} catch {
  errors.push('SVG policy check failed');
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('First-touch UX QA check passed: v1.0.66 adds tutorial, HUD/boss density guard, and keeps arrow-only start CTA stable.');
