import { readFileSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const pkg = JSON.parse(read('package.json'));
const main = read('src/main.ts');
const index = read('index.html');
const css = read('src/styles.css');
const sw = read('public/sw.js');
const pages = read('.github/workflows/github-pages.yml');
const quality = read('.github/workflows/quality-check.yml');
const errors = [];
const has = (text, token, label) => { if (!text.includes(token)) errors.push(`Missing ${label}: ${token}`); };

if (!['1.0.53', '1.0.54', '1.0.55', '1.0.56', '1.0.57', '1.0.58', '1.0.59', '1.0.60', '1.0.61', '1.0.62', '1.0.63', '1.0.64', '1.0.65', '1.0.66', '1.0.67', '1.0.68', '1.0.69', '1.0.70', '1.0.71', '1.0.72', '1.0.73', '1.0.74', '1.0.75', '1.0.76', '1.0.77'].includes(pkg.version)) errors.push(`package version must be 1.0.53 or 1.0.54, got ${pkg.version}`);
if (!pkg.scripts['check:summer-history-finale-density']) errors.push('missing package script check:summer-history-finale-density');

has(index, 'data-season-pass="v1053-shop-history-pass"', 'v1.0.53 season pass lobby mount');
has(index, 'data-season-shop="v1053-season-shop-history-claim-flow"', 'season shop history mount');
has(index, 'data-design-qa="v1053-mobile-density-qa"', 'mobile density QA mount');

has(main, 'SUMMER_SHOP_HISTORY_PATCH', 'shop history constant');
has(main, 'v1053-season-store-claim-history', 'shop history token');
has(main, 'SUMMER_SHOP_HISTORY_LIMIT', 'shop history limit');
has(main, 'state.seasonShopHistory', 'shop history state');
has(main, 'dream-library-season-shop-history', 'shop history local save');
has(main, 'FINALE_BOSS_CUTIN_COOLDOWN_PATCH', 'finale boss cooldown constant');
has(main, 'v1053-finale-cutin-cooldown-priority', 'finale boss cooldown token');
has(main, 'MOBILE_UI_DENSITY_QA_PATCH', 'mobile density constant');
has(main, 'v1053-mobile-ui-density-overlap-qa', 'mobile density token');
has(main, 'getSeasonClaimVisualState', 'shop claimed reflection helper');
has(main, 'data-season-claim-visual', 'boss claim visual dataset');

has(css, 'season-shop-history', 'shop history CSS');
has(css, 'v1053-season-store-claim-history', 'shop history CSS token');
has(css, 'v1053-mobile-ui-density-overlap-qa', 'mobile UI density CSS token');
has(css, 'v1053-history-density-gesture-qa', 'lobby gesture CSS token');
has(css, 'v1053-claimed-boss-icon-polish', 'boss claimed icon polish CSS token');

has(sw, 'dream-library-cache-v1.0.53', 'service worker v1.0.53 cache');
has(sw, 'texture-atlas-manifest-v1.0.53.json', 'service worker v1.0.53 atlas preload');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.53.json')) errors.push('missing v1.0.53 texture atlas manifest');

has(pages, 'npm run check:summer-history-finale-density', 'GitHub Pages check hook');
has(quality, 'npm run check:summer-history-finale-density', 'Quality check hook');

for (const forbidden of ['보기 맞춤', '중앙으로', '드래그 이동 도움말', 'minimap', 'board radar']) {
  if (index.includes(forbidden)) errors.push(`forbidden removed UI copy remains: ${forbidden}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Summer history, finale balance and mobile density check passed: v1.0.53 shop history, boss cooldown and UI density QA are active without removed UI.');
