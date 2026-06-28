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
if (!['1.0.50', '1.0.51', '1.0.52', '1.0.53', '1.0.54', '1.0.55', '1.0.56', '1.0.57', '1.0.58', '1.0.59'].includes(pkg.version)) errors.push(`package version must be 1.0.50-1.0.53, got ${pkg.version}`);
if (!pkg.scripts['check:summer-finale-shop-design']) errors.push('missing package script check:summer-finale-shop-design');
has(stages, 'chapter-15', '15 chapter summer finale expansion');
has(stages, ' 90, ', '90 stage finale campaign');
has(stages, 'shopItems', 'season shop items');
has(stages, 'finaleMissionLabels', 'finale mission labels');
has(stages, 'totalStages: 48', '48 summer stages');
if (!main.includes('v1051-summer-shop-claim-flow') && !main.includes('v1052-season-shop-reward-claim-flow') && !main.includes('v1053-season-shop-history-claim-flow')) errors.push('Missing summer season shop token');
if (!main.includes('v1051-finale-balance-missions') && !main.includes('v1052-finale-boss-missions') && !main.includes('v1053-finale-boss-balance-missions')) errors.push('Missing summer finale missions token');
has(main, 'getSummerShopCards', 'season shop cards renderer');
has(main, 'getSummerFinaleMissionCards', 'season finale mission cards renderer');
has(main, 'reward-chip-finale', 'finale reward chip');
has(css, 'season-shop-preview', 'season shop CSS');
has(css, 'season-finale-missions', 'finale missions CSS');
if (!css.includes('v1051-mobile-design-gesture-final') && !css.includes('v1052-mobile-store-gesture-qa') && !css.includes('v1053-history-density-gesture-qa')) errors.push('Missing design gesture QA CSS');
if (!css.includes('v1051-auto-focus-compact-carousel') && !css.includes('v1052-store-auto-focus-carousel') && !css.includes('v1053-shortcut-focus-carousel')) errors.push('Missing finale compact carousel CSS');
if (!index.includes('data-season-shop="v1051-summer-shop-claim-flow"') && !index.includes('data-season-shop="v1052-season-shop-reward-claim-flow"') && !index.includes('data-season-shop="v1053-season-shop-history-claim-flow"')) errors.push('Missing season shop panel attribute');
if (!index.includes('data-finale-missions="v1051-finale-balance-missions"') && !index.includes('data-finale-missions="v1052-finale-boss-missions"') && !index.includes('data-finale-missions="v1053-finale-boss-balance-missions"')) errors.push('Missing finale missions panel attribute');
if (!sw.includes('dream-library-cache-v1.0.51') && !sw.includes('dream-library-cache-v1.0.52') && !sw.includes('dream-library-cache-v1.0.53')) errors.push('Missing service worker v1.0.51-v1.0.53 cache');
if (!sw.includes('texture-atlas-manifest-v1.0.51.json') && !sw.includes('texture-atlas-manifest-v1.0.52.json') && !sw.includes('texture-atlas-manifest-v1.0.53.json')) errors.push('Missing v1.0.51-v1.0.53 atlas manifest preload');
if (!difficulty.includes('texture-atlas-manifest-v1.0.51.json') && !difficulty.includes('texture-atlas-manifest-v1.0.52.json') && !difficulty.includes('texture-atlas-manifest-v1.0.53.json')) errors.push('Missing v1.0.51-v1.0.53 atlas manifest difficulty preload');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.51.json') && !existsSync('public/assets/meta/texture-atlas-manifest-v1.0.52.json') && !existsSync('public/assets/meta/texture-atlas-manifest-v1.0.53.json')) errors.push('missing v1.0.51-v1.0.53 texture atlas manifest');
if (!pages.includes('npm run check:summer-finale-shop-design') || !quality.includes('npm run check:summer-finale-shop-design')) errors.push('workflows must run check:summer-finale-shop-design');
for (const forbidden of ['보기 맞춤', '중앙으로', '드래그 이동 도움말', 'minimap', 'board radar']) {
  if (index.includes(forbidden)) errors.push(`forbidden removed UI copy remains: ${forbidden}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Summer finale shop/design check passed: 90-stage finale, shop, mission cards and density QA are active.');
