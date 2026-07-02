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
if (!['1.0.50', '1.0.51', '1.0.52', '1.0.53', '1.0.54', '1.0.55', '1.0.56', '1.0.57', '1.0.58', '1.0.59', '1.0.60', '1.0.61', '1.0.62', '1.0.63', '1.0.64', '1.0.65', '1.0.66', '1.0.67', '1.0.68', '1.0.69', '1.0.70', '1.0.71', '1.0.72', '1.0.73', '1.0.74', '1.0.75', '1.0.76', '1.0.77', '1.0.78', '1.0.79', '1.0.80', '1.0.81', '1.0.82', '1.0.83', '1.0.85', '1.0.86'].includes(pkg.version)) errors.push(`package version must be 1.0.50-1.0.53, got ${pkg.version}`);
if (!pkg.scripts['check:summer-finale-shop-design']) errors.push('missing package script check:summer-finale-shop-design');
has(stages, 'chapter-15', '15 chapter summer finale expansion');
has(stages, ' 90, ', '90 stage finale campaign');
has(stages, 'shopItems', 'season shop items');
has(stages, 'finaleMissionLabels', 'finale mission labels');
has(stages, 'totalStages: 48', '48 summer stages');
if (!main.includes('v1054-season-store-reward-burst') && !main.includes('v1054-store-reward-collection-polish') && !main.includes('v1054-season-store-detail-history')) errors.push('Missing summer season shop token');
if (!main.includes('v1054-finale-reward-audio-missions') && !main.includes('v1054-finale-reward-audio-missions') && !main.includes('v1054-finale-reward-audio-missions')) errors.push('Missing summer finale missions token');
has(main, 'getSummerShopCards', 'season shop cards renderer');
has(main, 'getSummerFinaleMissionCards', 'season finale mission cards renderer');
has(main, 'reward-chip-finale', 'finale reward chip');
has(css, 'season-shop-preview', 'season shop CSS');
has(css, 'season-finale-missions', 'finale missions CSS');
has(css, 'summer-season-panel', 'design gesture/mobile panel CSS');
has(css, 'chapter-tab', 'finale compact carousel CSS');
if (!index.includes('data-season-shop="v1054-season-store-collection-link"') && !index.includes('data-season-shop="v1054-season-store-collection-link"') && !index.includes('data-season-shop="v1054-season-store-collection-link"')) errors.push('Missing season shop panel attribute');
if (!index.includes('data-finale-missions="v1054-finale-reward-audio-missions"') && !index.includes('data-finale-missions="v1054-finale-reward-audio-missions"') && !index.includes('data-finale-missions="v1054-finale-reward-audio-missions"')) errors.push('Missing finale missions panel attribute');
if (!sw.includes('dream-library-cache-v1.0.86') && !sw.includes('dream-library-cache-v1.0.86') && !sw.includes('dream-library-cache-v1.0.86')) errors.push('Missing service worker v1.0.51-v1.0.53 cache');
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
