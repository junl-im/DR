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

if (!['1.0.54', '1.0.55', '1.0.56', '1.0.57', '1.0.58', '1.0.59', '1.0.60', '1.0.61', '1.0.62', '1.0.63', '1.0.64', '1.0.65', '1.0.66', '1.0.67', '1.0.68', '1.0.69'].includes(pkg.version)) errors.push(`package version must be 1.0.54, got ${pkg.version}`);
if (!pkg.scripts['check:season-store-engine-design']) errors.push('missing package script check:season-store-engine-design');

has(index, 'data-season-pass="v1054-store-collection-pass"', 'v1.0.54 season pass lobby mount');
has(index, 'data-engine-upgrade="v1054-adaptive-visual-budget"', 'engine upgrade lobby mount');
has(index, 'v1054-duplicate-id-cleanup', 'duplicate progress card cleanup token');
if ((index.match(/id="best-score-label"/g) || []).length !== 1) errors.push('best-score-label must appear exactly once after duplicate card cleanup');
if ((index.match(/id="clear-count-label"/g) || []).length !== 1) errors.push('clear-count-label must appear exactly once after duplicate card cleanup');
if ((index.match(/id="star-count-label"/g) || []).length !== 1) errors.push('star-count-label must appear exactly once after duplicate card cleanup');

has(main, 'SEASON_STORE_COLLECTION_LINK_PATCH', 'season store collection link constant');
has(main, 'v1054-season-store-collection-link-detail', 'season store collection link token');
has(main, 'function openSeasonShopRewardDetail', 'season shop detail function');
has(main, 'function applyAdaptiveVisualBudget', 'adaptive visual budget function');
has(main, 'v1054-adaptive-visual-budget', 'adaptive visual budget token');
has(main, 'v1054-engine-design-gesture-qa', 'lobby gesture QA token');
has(main, 'v1054-mobile-design-overlap-audit', 'mobile design overlap audit token');
has(main, 'data-store-link', 'store detail dataset');

has(css, 'v1054-season-store-collection-link-detail', 'collection link CSS token');
has(css, 'v1054-adaptive-visual-budget', 'adaptive visual CSS token');
has(css, 'v1054-engine-design-gesture-qa', 'gesture CSS token');
has(css, 'v1054-mobile-design-overlap-audit', 'mobile CSS token');
has(css, 'v1054-duplicate-id-cleanup', 'duplicate cleanup CSS token');

has(sw, 'dream-library-cache-v1.0.54', 'service worker v1.0.54 cache');
has(sw, 'texture-atlas-manifest-v1.0.54.json', 'service worker v1.0.54 atlas preload');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.54.json')) errors.push('missing v1.0.54 texture atlas manifest');

has(pages, 'npm run check:season-store-engine-design', 'GitHub Pages check hook');
has(quality, 'npm run check:season-store-engine-design', 'Quality check hook');

for (const forbidden of ['보기 맞춤', '중앙으로', '드래그 이동 도움말', 'minimap', 'board radar']) {
  if (index.includes(forbidden)) errors.push(`forbidden removed UI copy remains: ${forbidden}`);
}

if (errors.length) {
  console.error(`Season store engine design check failed: ${errors.join('; ')}`);
  process.exit(1);
}
console.log('Season store engine design check passed: v1.0.54 collection links, adaptive visual budget, duplicate ID cleanup and mobile design QA are active.');
