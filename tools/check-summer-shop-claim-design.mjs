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
if (pkg.version !== '1.0.51') errors.push(`package version must be 1.0.51, got ${pkg.version}`);
if (!pkg.scripts['check:summer-shop-claim-design']) errors.push('missing package script check:summer-shop-claim-design');
has(stages, 'costType', 'season shop cost metadata');
has(stages, 'rewardType', 'season shop reward metadata');
has(stages, 'totalStages: 48', '48 summer stages remain');
has(stages, ' 90, ', '90 stage campaign remains');
has(main, 'seasonShopClaims', 'season shop claim persistence');
has(main, 'claimSummerShopItem', 'season shop claim handler');
has(main, 'v1051-summer-shop-claim-flow', 'v1.0.51 shop claim token');
has(main, 'current-chapter-v1051', 'chapter carousel auto focus token');
has(main, 'next-goal-v1051-shop-claim', 'stage map next-goal v1051 token');
has(css, 'v1051-mobile-design-density-qa', 'mobile design QA CSS token');
has(css, '.season-shop-claim', 'season shop claim button CSS');
has(css, 'data-shop-state="claimable"', 'claimable shop state CSS');
has(index, 'data-season-shop="v1051-summer-shop-claim-flow"', 'v1051 season shop panel mount');
has(index, 'data-finale-missions="v1051-finale-balance-missions"', 'v1051 finale mission panel mount');
has(sw, 'dream-library-cache-v1.0.51', 'v1.0.51 service worker cache');
has(sw, 'texture-atlas-manifest-v1.0.51.json', 'v1.0.51 atlas preload');
has(difficulty, 'texture-atlas-manifest-v1.0.51.json', 'v1.0.51 difficulty manifest preload');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.51.json')) errors.push('missing v1.0.51 texture atlas manifest');
if (!pages.includes('npm run check:summer-shop-claim-design') || !quality.includes('npm run check:summer-shop-claim-design')) errors.push('workflows must run check:summer-shop-claim-design');
for (const forbidden of ['보기 맞춤', '중앙으로', '드래그 이동 도움말', 'minimap', 'board radar']) {
  if (index.includes(forbidden)) errors.push(`forbidden removed UI copy remains: ${forbidden}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Summer shop claim/design check passed: claim flow, finale balance, mobile QA and v1.0.51 cache/atlas are active.');
