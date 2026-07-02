import { existsSync, readFileSync } from 'node:fs';
const read = (path) => readFileSync(path, 'utf8');
const pkg = JSON.parse(read('package.json'));
const stages = read('src/game/stages.js');
const main = read('src/main.ts');
const css = read('src/styles.css');
const index = read('index.html');
const sw = read('public/sw.js');
const difficulty = read('src/game/difficulty.js');
const pages = read('.github/workflows/github-pages.yml');
const quality = read('.github/workflows/quality-check.yml');
const errors = [];
const has = (text, token, label) => { if (!text.includes(token)) errors.push(`Missing ${label}: ${token}`); };
if (!['1.0.52', '1.0.53', '1.0.54', '1.0.55', '1.0.56', '1.0.57', '1.0.58', '1.0.59', '1.0.60', '1.0.61', '1.0.62', '1.0.63', '1.0.64', '1.0.65', '1.0.66', '1.0.67', '1.0.68', '1.0.69', '1.0.70', '1.0.71', '1.0.72', '1.0.73', '1.0.74', '1.0.75', '1.0.76', '1.0.77', '1.0.78', '1.0.79', '1.0.80', '1.0.81', '1.0.82', '1.0.83', '1.0.85', '1.0.86'].includes(pkg.version)) errors.push(`package version must be 1.0.52 or 1.0.53, got ${pkg.version}`);
if (!pkg.scripts['check:summer-shop-reward-polish']) errors.push('missing package script check:summer-shop-reward-polish');
has(stages, 'finale-cutin-script', 'new finale cut-in shop item');
has(stages, 'sourceHint', 'shop item source hints');
if (!main.includes('STORE_REWARD_COLLECTION_POLISH_PATCH') && !main.includes('SUMMER_SHOP_HISTORY_PATCH')) errors.push('Missing season shop reward flow token');
if (!main.includes('v1054-season-store-reward-burst') && !main.includes('v1054-season-store-reward-burst')) errors.push('Missing shop claim burst token');
if (!main.includes('v1054-season-shop-material-shortcut') && !main.includes('v1054-season-shop-material-shortcut')) errors.push('Missing shop earn shortcut token');
if (!main.includes('v1054-finale-reward-audio-cutin') && !main.includes('v1054-finale-audio-cooldown-priority')) errors.push('Missing finale boss cut-in token');
has(main, 'playSeasonShopClaimBurst', 'shop reward burst function');
has(main, 'focusSummerShopMaterial', 'shop shortage shortcut function');
has(main, 'playFinaleBossEventCutin', 'finale boss cut-in function');
has(css, 'seasonShopPanelRewardPulse', 'shop panel reward pulse CSS');
has(css, '.season-shop-earn', 'earn shortcut button CSS');
has(css, 'finaleBossCutinPop', 'finale boss cut-in CSS animation');
if (!index.includes('data-season-shop="v1054-season-store-collection-link"') && !index.includes('data-season-shop="v1054-season-store-collection-link"')) errors.push('Missing v1.0.52/v1.0.53 season shop panel mount');
if (!index.includes('data-finale-missions="v1054-finale-reward-audio-missions"') && !index.includes('data-finale-missions="v1054-finale-reward-audio-missions"')) errors.push('Missing v1.0.52/v1.0.53 finale mission panel mount');
if (!sw.includes('dream-library-cache-v1.0.86') && !sw.includes('dream-library-cache-v1.0.86')) errors.push('Missing v1.0.52/v1.0.53 service worker cache');
if (!sw.includes('texture-atlas-manifest-v1.0.52.json') && !sw.includes('texture-atlas-manifest-v1.0.53.json')) errors.push('Missing v1.0.52/v1.0.53 atlas preload');
if (!difficulty.includes('texture-atlas-manifest-v1.0.52.json') && !difficulty.includes('texture-atlas-manifest-v1.0.53.json')) errors.push('Missing v1.0.52/v1.0.53 difficulty atlas preload');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.52.json') && !existsSync('public/assets/meta/texture-atlas-manifest-v1.0.53.json')) errors.push('missing v1.0.52/v1.0.53 texture atlas manifest');
if (!pages.includes('npm run check:summer-shop-reward-polish') || !quality.includes('npm run check:summer-shop-reward-polish')) errors.push('workflows must run check:summer-shop-reward-polish');
for (const forbidden of ['보기 맞춤', '중앙으로', '드래그 이동 도움말', 'minimap', 'board radar', '<svg']) {
  if (index.includes(forbidden) || main.includes(forbidden) || css.includes(forbidden)) errors.push(`forbidden removed UI copy or SVG remains: ${forbidden}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Summer shop reward polish check passed: claim burst, earn shortcut, finale boss cut-in, mobile store UX and v1.0.52 cache/atlas are active.');
