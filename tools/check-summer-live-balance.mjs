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
if (pkg.version !== '1.0.48') errors.push(`package version must be 1.0.48, got ${pkg.version}`);
if (!pkg.scripts['check:summer-live-balance']) errors.push('missing package script check:summer-live-balance');
const stageMatches = [...stages.matchAll(/stage\('/g)].length;
if (stageMatches < 78) errors.push(`expected at least 78 stages, got ${stageMatches}`);
has(stages, 'passMilestones', 'summer pass milestones');
has(stages, 'passRewardLabel', 'summer pass reward label');
has(main, 'v1048-summer-live-balance-pass', 'summer live balance token');
has(main, 'SUMMER_REWARD_PASS_PATCH', 'reward pass patch constant');
has(main, 'SUMMER_SEASON_COMBO_BONUS_BY_DIFFICULTY', 'difficulty based season combo bonus');
has(main, 'getSummerSeasonLiveComboBonus', 'season live combo helper');
has(main, 'getSummerSeasonPassRewardForClears', 'season pass reward helper');
has(main, 'state.lastSeasonPassReward', 'reward modal pass bridge');
has(index, 'data-season-pass="v1048-summer-reward-pass-track"', 'season pass lobby mount');
has(css, 'season-pass-track', 'season pass CSS');
has(css, 'v1048-campaign-gesture-fluid', 'campaign gesture CSS token');
has(sw, 'dream-library-cache-v1.0.48', 'service worker v1.0.48 cache');
has(sw, 'texture-atlas-manifest-v1.0.48.json', 'v1.0.48 atlas manifest preload');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.48.json')) errors.push('missing v1.0.48 texture atlas manifest');
if (!pages.includes('npm run check:summer-live-balance') || !quality.includes('npm run check:summer-live-balance')) errors.push('workflows must run check:summer-live-balance');
for (const forbidden of ['보기 맞춤', '중앙으로', '드래그 이동 도움말', 'minimap', 'board radar']) {
  if (index.includes(forbidden)) errors.push(`forbidden removed UI copy remains: ${forbidden}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Summer live balance check passed: reward pass, difficulty combo bonus, v1.0.48 cache and mobile campaign QA are active.');
