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
if (!['1.0.50', '1.0.51'].includes(pkg.version)) errors.push(`package version must be 1.0.50 or 1.0.51, got ${pkg.version}`);
if (!pkg.scripts['check:summer-finale-shop-design']) errors.push('missing package script check:summer-finale-shop-design');
has(stages, 'chapter-15', '15 chapter summer finale expansion');
has(stages, ' 90, ', '90 stage finale campaign');
has(stages, 'shopItems', 'season shop items');
has(stages, 'finaleMissionLabels', 'finale mission labels');
has(stages, 'totalStages: 48', '48 summer stages');
has(main, 'v1051-summer-shop-claim-flow', 'summer season shop token');
has(main, 'v1051-finale-balance-missions', 'summer finale missions token');
has(main, 'getSummerShopCards', 'season shop cards renderer');
has(main, 'getSummerFinaleMissionCards', 'season finale mission cards renderer');
has(main, 'reward-chip-finale', 'finale reward chip');
has(css, 'season-shop-preview', 'season shop CSS');
has(css, 'season-finale-missions', 'finale missions CSS');
has(css, 'v1051-mobile-design-gesture-final', 'design gesture QA CSS');
has(css, 'v1051-auto-focus-compact-carousel', 'finale compact carousel CSS');
has(index, 'data-season-shop="v1051-summer-shop-claim-flow"', 'season shop panel attribute');
has(index, 'data-finale-missions="v1051-finale-balance-missions"', 'finale missions panel attribute');
has(sw, 'dream-library-cache-v1.0.51', 'service worker v1.0.50 cache');
has(sw, 'texture-atlas-manifest-v1.0.51.json', 'v1.0.50 atlas manifest preload');
has(difficulty, 'texture-atlas-manifest-v1.0.51.json', 'v1.0.50 atlas manifest difficulty preload');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.51.json')) errors.push('missing v1.0.50 texture atlas manifest');
if (!pages.includes('npm run check:summer-finale-shop-design') || !quality.includes('npm run check:summer-finale-shop-design')) errors.push('workflows must run check:summer-finale-shop-design');
for (const forbidden of ['보기 맞춤', '중앙으로', '드래그 이동 도움말', 'minimap', 'board radar']) {
  if (index.includes(forbidden)) errors.push(`forbidden removed UI copy remains: ${forbidden}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Summer finale shop/design check passed: 90-stage finale, shop, mission cards and density QA are active.');
