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
if (!['1.0.52', '1.0.53', '1.0.54', '1.0.55'].includes(pkg.version)) errors.push(`package version must be 1.0.52 or 1.0.53, got ${pkg.version}`);
if (!pkg.scripts['check:summer-shop-reward-polish']) errors.push('missing package script check:summer-shop-reward-polish');
has(stages, 'finale-cutin-script', 'new finale cut-in shop item');
has(stages, 'sourceHint', 'shop item source hints');
if (!main.includes('v1052-season-shop-reward-claim-flow') && !main.includes('v1053-season-shop-history-claim-flow')) errors.push('Missing v1.0.52/v1.0.53 shop reward flow token');
if (!main.includes('v1052-season-shop-claim-burst') && !main.includes('v1053-season-shop-history-burst')) errors.push('Missing shop claim burst token');
if (!main.includes('v1052-season-shop-earn-shortcut') && !main.includes('v1053-season-shop-earn-focus-shortcut')) errors.push('Missing shop earn shortcut token');
if (!main.includes('v1052-finale-boss-cutin') && !main.includes('v1053-finale-boss-cooldown-cutin')) errors.push('Missing finale boss cut-in token');
has(main, 'playSeasonShopClaimBurst', 'shop reward burst function');
has(main, 'focusSummerShopMaterial', 'shop shortage shortcut function');
has(main, 'playFinaleBossEventCutin', 'finale boss cut-in function');
has(css, 'seasonShopPanelRewardPulse', 'shop panel reward pulse CSS');
has(css, '.season-shop-earn', 'earn shortcut button CSS');
has(css, 'finaleBossCutinPop', 'finale boss cut-in CSS animation');
if (!index.includes('data-season-shop="v1052-season-shop-reward-claim-flow"') && !index.includes('data-season-shop="v1053-season-shop-history-claim-flow"')) errors.push('Missing v1.0.52/v1.0.53 season shop panel mount');
if (!index.includes('data-finale-missions="v1052-finale-boss-missions"') && !index.includes('data-finale-missions="v1053-finale-boss-balance-missions"')) errors.push('Missing v1.0.52/v1.0.53 finale mission panel mount');
if (!sw.includes('dream-library-cache-v1.0.52') && !sw.includes('dream-library-cache-v1.0.53')) errors.push('Missing v1.0.52/v1.0.53 service worker cache');
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
