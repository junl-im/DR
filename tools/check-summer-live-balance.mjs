import { readFileSync, existsSync } from 'node:fs';
const read = (path) => readFileSync(path, 'utf8');
const pkg = JSON.parse(read('package.json'));
const stages = read('src/game/stages.js');
const main = read('src/main.ts');
const index = read('index.html');
const css = read('src/styles.css');
const sw = read('public/sw.js');
const pages = read('.github/workflows/github-pages.yml');
const quality = read('.github/workflows/quality-check.yml');
const errors = [];
const has = (text, token, label) => { if (!text.includes(token)) errors.push(`Missing ${label}: ${token}`); };
if (!['1.0.48', '1.0.49', '1.0.50', '1.0.51', '1.0.52', '1.0.53', '1.0.54', '1.0.55', '1.0.56', '1.0.57', '1.0.58', '1.0.59', '1.0.60', '1.0.61', '1.0.62', '1.0.63', '1.0.64', '1.0.65', '1.0.66', '1.0.67', '1.0.68', '1.0.69', '1.0.70', '1.0.71', '1.0.72', '1.0.73', '1.0.74', '1.0.75', '1.0.76', '1.0.77', '1.0.78', '1.0.79', '1.0.80', '1.0.81'].includes(pkg.version)) errors.push(`package version must be 1.0.48-1.0.53, got ${pkg.version}`);
if (!pkg.scripts['check:summer-live-balance']) errors.push('missing package script check:summer-live-balance');
const stageMatches = [...stages.matchAll(/stage\('/g)].length;
if (stageMatches < 78) errors.push(`expected at least 78 stages, got ${stageMatches}`);
has(stages, 'passMilestones', 'summer pass milestones');
has(stages, 'passRewardLabel', 'summer pass reward label');
if (!main.includes('v1048-summer-live-balance-pass') && !main.includes('v1049-summer-event-vfx') && !main.includes('v1050-summer-finale-event-vfx') && !main.includes('v1051-summer-shop-claim-vfx') && !main.includes('v1052-season-shop-history-burst') && !main.includes('v1053-shop-history-vfx')) errors.push('Missing summer live balance, event VFX, finale or shop history token');
has(main, 'SUMMER_REWARD_PASS_PATCH', 'reward pass patch constant');
has(main, 'SUMMER_SEASON_COMBO_BONUS_BY_DIFFICULTY', 'difficulty based season combo bonus');
has(main, 'getSummerSeasonLiveComboBonus', 'season live combo helper');
has(main, 'getSummerSeasonPassRewardForClears', 'season pass reward helper');
has(main, 'state.lastSeasonPassReward', 'reward modal pass bridge');
if (!index.includes('data-season-pass="v1048-summer-reward-pass-track"') && !index.includes('data-season-pass="v1049-summer-pass-missions"') && !index.includes('data-season-pass="v1050-summer-finale-pass-shop"') && !index.includes('data-season-pass="v1051-summer-shop-claim-pass"') && !index.includes('data-season-pass="v1052-season-shop-reward-polish-pass"') && !index.includes('data-season-pass="v1053-shop-history-pass"')) errors.push('Missing season pass lobby mount');
has(css, 'season-pass-track', 'season pass CSS');
if (!css.includes('v1048-campaign-gesture-fluid') && !css.includes('v1049-season-vfx-gesture-qa') && !css.includes('v1050-summer-design-gesture-qa') && !css.includes('v1051-mobile-design-gesture-final') && !css.includes('v1052-mobile-store-gesture-qa') && !css.includes('v1053-history-density-gesture-qa')) errors.push('Missing campaign gesture CSS token');
if (!sw.includes('dream-library-cache-v1.0.48') && !sw.includes('dream-library-cache-v1.0.49') && !sw.includes('dream-library-cache-v1.0.50') && !sw.includes('dream-library-cache-v1.0.51') && !sw.includes('dream-library-cache-v1.0.52') && !sw.includes('dream-library-cache-v1.0.53')) errors.push('Missing service worker v1.0.48-v1.0.53 cache');
if (!sw.includes('texture-atlas-manifest-v1.0.48.json') && !sw.includes('texture-atlas-manifest-v1.0.49.json') && !sw.includes('texture-atlas-manifest-v1.0.50.json') && !sw.includes('texture-atlas-manifest-v1.0.51.json') && !sw.includes('texture-atlas-manifest-v1.0.52.json') && !sw.includes('texture-atlas-manifest-v1.0.53.json')) errors.push('Missing v1.0.48-v1.0.53 atlas manifest preload');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.48.json') && !existsSync('public/assets/meta/texture-atlas-manifest-v1.0.49.json') && !existsSync('public/assets/meta/texture-atlas-manifest-v1.0.50.json') && !existsSync('public/assets/meta/texture-atlas-manifest-v1.0.51.json') && !existsSync('public/assets/meta/texture-atlas-manifest-v1.0.52.json') && !existsSync('public/assets/meta/texture-atlas-manifest-v1.0.53.json')) errors.push('missing v1.0.48-v1.0.53 texture atlas manifest');
if (!pages.includes('npm run check:summer-live-balance') || !quality.includes('npm run check:summer-live-balance')) errors.push('workflows must run check:summer-live-balance');
for (const forbidden of ['보기 맞춤', '중앙으로', '드래그 이동 도움말', 'minimap', 'board radar']) {
  if (index.includes(forbidden)) errors.push(`forbidden removed UI copy remains: ${forbidden}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Summer live balance check passed: reward pass, difficulty combo bonus, v1.0.48 cache and mobile campaign QA are active.');
