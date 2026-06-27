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
if (pkg.version !== '1.0.52') errors.push(`package version must be 1.0.52, got ${pkg.version}`);
if (!pkg.scripts['check:summer-shop-reward-polish']) errors.push('missing package script check:summer-shop-reward-polish');
has(stages, 'finale-cutin-script', 'new finale cut-in shop item');
has(stages, 'sourceHint', 'shop item source hints');
has(main, 'v1052-season-shop-reward-claim-flow', 'v1.0.52 shop reward flow token');
has(main, 'v1052-season-shop-claim-burst', 'shop claim burst token');
has(main, 'v1052-season-shop-earn-shortcut', 'shop earn shortcut token');
has(main, 'v1052-finale-boss-cutin', 'finale boss cut-in token');
has(main, 'playSeasonShopClaimBurst', 'shop reward burst function');
has(main, 'focusSummerShopMaterial', 'shop shortage shortcut function');
has(main, 'playFinaleBossEventCutin', 'finale boss cut-in function');
has(css, 'seasonShopPanelRewardPulse', 'shop panel reward pulse CSS');
has(css, '.season-shop-earn', 'earn shortcut button CSS');
has(css, 'finaleBossCutinPop', 'finale boss cut-in CSS animation');
has(index, 'data-season-shop="v1052-season-shop-reward-claim-flow"', 'v1.0.52 season shop panel mount');
has(index, 'data-finale-missions="v1052-finale-boss-missions"', 'v1.0.52 finale mission panel mount');
has(sw, 'dream-library-cache-v1.0.52', 'v1.0.52 service worker cache');
has(sw, 'texture-atlas-manifest-v1.0.52.json', 'v1.0.52 atlas preload');
has(difficulty, 'texture-atlas-manifest-v1.0.52.json', 'v1.0.52 difficulty atlas preload');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.52.json')) errors.push('missing v1.0.52 texture atlas manifest');
if (!pages.includes('npm run check:summer-shop-reward-polish') || !quality.includes('npm run check:summer-shop-reward-polish')) errors.push('workflows must run check:summer-shop-reward-polish');
for (const forbidden of ['보기 맞춤', '중앙으로', '드래그 이동 도움말', 'minimap', 'board radar', '<svg']) {
  if (index.includes(forbidden) || main.includes(forbidden) || css.includes(forbidden)) errors.push(`forbidden removed UI copy or SVG remains: ${forbidden}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Summer shop reward polish check passed: claim burst, earn shortcut, finale boss cut-in, mobile store UX and v1.0.52 cache/atlas are active.');
