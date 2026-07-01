import { readFileSync, existsSync } from 'node:fs';
const read = (path) => readFileSync(path, 'utf8');
const pkg = JSON.parse(read('package.json'));
const stages = read('src/game/stages.js');
const main = read('src/main.ts');
const renderer = read('src/rendering/DreamPixiRenderer.ts');
const index = read('index.html');
const css = read('src/styles.css');
const sw = read('public/sw.js');
const pages = read('.github/workflows/github-pages.yml');
const quality = read('.github/workflows/quality-check.yml');
const errors = [];
const has = (text, token, label) => { if (!text.includes(token)) errors.push(`Missing ${label}: ${token}`); };
if (!['1.0.49', '1.0.50', '1.0.51', '1.0.52', '1.0.53', '1.0.54', '1.0.55', '1.0.56', '1.0.57', '1.0.58', '1.0.59', '1.0.60', '1.0.61', '1.0.62', '1.0.63', '1.0.64', '1.0.65', '1.0.66', '1.0.67', '1.0.68', '1.0.69', '1.0.70', '1.0.71', '1.0.72', '1.0.73', '1.0.74', '1.0.75', '1.0.76', '1.0.77', '1.0.78'].includes(pkg.version)) errors.push(`package version must be 1.0.49-1.0.53, got ${pkg.version}`);
if (!pkg.scripts['check:summer-event-vfx-pass']) errors.push('missing package script check:summer-event-vfx-pass');
has(stages, 'passMissionLabels', 'season pass mission labels');
has(stages, 'vfxModifiers', 'summer VFX modifier export');
if (!main.includes('v1051-summer-shop-claim-vfx') && !main.includes('v1052-season-shop-reward-vfx') && !main.includes('v1053-shop-history-vfx')) errors.push('Missing summer event VFX token');
if (!main.includes('v1051-summer-shop-claim-pass') && !main.includes('v1052-season-shop-reward-pass') && !main.includes('v1053-shop-history-pass')) errors.push('Missing summer pass missions token');
has(main, 'getSummerPassMissionCards', 'season pass mission cards');
has(main, 'getSummerModifierVfxLabels', 'modifier VFX labels');
has(main, 'renderer.playSummerModifierVfx', 'modifier VFX bridge');
has(main, 'renderer.playSeasonPassRewardBurst', 'season pass reward burst bridge');
if (!main.includes('v1051-auto-focus-compact-carousel') && !main.includes('v1052-store-auto-focus-carousel') && !main.includes('v1053-shortcut-focus-carousel')) errors.push('Missing compact chapter carousel token');
if (!main.includes('v1051-boss-season-icon-readability') && !main.includes('v1052-boss-finale-cutin-icon') && !main.includes('v1053-claimed-boss-icon-polish')) errors.push('Missing boss season polish token');
has(renderer, 'playSummerModifierVfx', 'renderer summer modifier VFX');
has(renderer, 'playSeasonPassRewardBurst', 'renderer pass reward burst');
has(renderer, 'summer-event-vfx', 'VFX graphics label');
if (!index.includes('data-season-vfx="v1051-summer-shop-claim-vfx"') && !index.includes('data-season-vfx="v1052-season-shop-reward-vfx"') && !index.includes('data-season-vfx="v1053-shop-history-vfx"')) errors.push('Missing season VFX lobby mount');
if (!index.includes('data-season-pass="v1051-summer-shop-claim-pass"') && !index.includes('data-season-pass="v1052-season-shop-reward-pass"') && !index.includes('data-season-pass="v1053-shop-history-pass"')) errors.push('Missing pass missions lobby mount');
has(css, 'season-pass-missions', 'pass missions CSS');
if (!css.includes('v1051-mobile-design-gesture-final') && !css.includes('v1052-mobile-store-gesture-qa') && !css.includes('v1053-history-density-gesture-qa')) errors.push('Missing season gesture QA CSS');
if (!css.includes('v1051-auto-focus-compact-carousel') && !css.includes('v1052-store-auto-focus-carousel') && !css.includes('v1053-shortcut-focus-carousel')) errors.push('Missing compact carousel CSS');
if (!css.includes('v1051-boss-season-icon-readability') && !css.includes('v1052-boss-finale-cutin-icon') && !css.includes('v1053-claimed-boss-icon-polish')) errors.push('Missing boss season polish CSS');
if (!sw.includes('dream-library-cache-v1.0.51') && !sw.includes('dream-library-cache-v1.0.52') && !sw.includes('dream-library-cache-v1.0.53')) errors.push('Missing service worker v1.0.51-v1.0.53 cache');
if (!sw.includes('texture-atlas-manifest-v1.0.51.json') && !sw.includes('texture-atlas-manifest-v1.0.52.json') && !sw.includes('texture-atlas-manifest-v1.0.53.json')) errors.push('Missing v1.0.51-v1.0.53 atlas manifest preload');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.51.json') && !existsSync('public/assets/meta/texture-atlas-manifest-v1.0.52.json') && !existsSync('public/assets/meta/texture-atlas-manifest-v1.0.53.json')) errors.push('missing v1.0.51-v1.0.53 texture atlas manifest');
if (!pages.includes('npm run check:summer-event-vfx-pass') || !quality.includes('npm run check:summer-event-vfx-pass')) errors.push('workflows must run check:summer-event-vfx-pass');
for (const forbidden of ['보기 맞춤', '중앙으로', '드래그 이동 도움말', 'minimap', 'board radar']) {
  if (index.includes(forbidden)) errors.push(`forbidden removed UI copy remains: ${forbidden}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Summer event VFX/pass check passed: modifier VFX, pass missions, compact carousel and boss season polish are active.');
