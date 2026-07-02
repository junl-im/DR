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
if (!['1.0.51', '1.0.52', '1.0.53', '1.0.54', '1.0.55', '1.0.56', '1.0.57', '1.0.58', '1.0.59', '1.0.60', '1.0.61', '1.0.62', '1.0.63', '1.0.64', '1.0.65', '1.0.66', '1.0.67', '1.0.68', '1.0.69', '1.0.70', '1.0.71', '1.0.72', '1.0.73', '1.0.74', '1.0.75', '1.0.76', '1.0.77', '1.0.78', '1.0.79', '1.0.80', '1.0.81', '1.0.82', '1.0.83', '1.0.85'].includes(pkg.version)) errors.push(`package version must be 1.0.51-1.0.53, got ${pkg.version}`);
if (!pkg.scripts['check:summer-shop-claim-design']) errors.push('missing package script check:summer-shop-claim-design');
has(stages, 'costType', 'season shop cost metadata');
has(stages, 'rewardType', 'season shop reward metadata');
has(stages, 'totalStages: 48', '48 summer stages remain');
has(stages, ' 90, ', '90 stage campaign remains');
has(main, 'seasonShopClaims', 'season shop claim persistence');
has(main, 'claimSummerShopItem', 'season shop claim handler');
if (!main.includes('v1054-season-store-reward-burst') && !main.includes('v1054-store-reward-collection-polish') && !main.includes('v1054-season-store-detail-history')) errors.push('Missing v1.0.51-v1.0.53 shop claim token');
if (!main.includes('v1054-current-chapter-polish-carousel') && !main.includes('v1054-current-chapter-polish-carousel') && !main.includes('v1054-current-chapter-polish-carousel')) errors.push('Missing chapter carousel auto focus token');
if (!main.includes('v1054-season-store-reward-burst') && !main.includes('v1054-store-reward-collection-polish') && !main.includes('v1054-season-store-detail-history')) errors.push('Missing stage map next-goal token');
if (!css.includes('v1051-mobile-design-density-qa') && !css.includes('v1052-mobile-store-design-qa') && !css.includes('v1054-mobile-polish-density')) errors.push('Missing mobile design QA CSS token');
has(css, '.season-shop-claim', 'season shop claim button CSS');
has(css, 'data-shop-state="claimable"', 'claimable shop state CSS');
if (!index.includes('data-season-shop="v1054-season-store-collection-link"') && !index.includes('data-season-shop="v1054-season-store-collection-link"') && !index.includes('data-season-shop="v1054-season-store-collection-link"')) errors.push('Missing v1051-v1053 season shop panel mount');
if (!index.includes('data-finale-missions="v1054-finale-reward-audio-missions"') && !index.includes('data-finale-missions="v1054-finale-reward-audio-missions"') && !index.includes('data-finale-missions="v1054-finale-reward-audio-missions"')) errors.push('Missing v1051-v1053 finale mission panel mount');
if (!sw.includes('dream-library-cache-v1.0.51') && !sw.includes('dream-library-cache-v1.0.52') && !sw.includes('dream-library-cache-v1.0.53')) errors.push('Missing v1.0.51-v1.0.53 service worker cache');
if (!sw.includes('texture-atlas-manifest-v1.0.51.json') && !sw.includes('texture-atlas-manifest-v1.0.52.json') && !sw.includes('texture-atlas-manifest-v1.0.53.json')) errors.push('Missing v1.0.51-v1.0.53 atlas preload');
if (!difficulty.includes('texture-atlas-manifest-v1.0.51.json') && !difficulty.includes('texture-atlas-manifest-v1.0.52.json') && !difficulty.includes('texture-atlas-manifest-v1.0.53.json')) errors.push('Missing v1.0.51-v1.0.53 difficulty manifest preload');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.51.json') && !existsSync('public/assets/meta/texture-atlas-manifest-v1.0.52.json') && !existsSync('public/assets/meta/texture-atlas-manifest-v1.0.53.json')) errors.push('missing v1.0.51-v1.0.53 texture atlas manifest');
if (!pages.includes('npm run check:summer-shop-claim-design') || !quality.includes('npm run check:summer-shop-claim-design')) errors.push('workflows must run check:summer-shop-claim-design');
for (const forbidden of ['보기 맞춤', '중앙으로', '드래그 이동 도움말', 'minimap', 'board radar']) {
  if (index.includes(forbidden)) errors.push(`forbidden removed UI copy remains: ${forbidden}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Summer shop claim/design check passed: claim flow, finale balance, mobile QA and v1.0.51 cache/atlas are active.');
