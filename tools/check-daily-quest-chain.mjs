import { existsSync, readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const pkg = JSON.parse(read('package.json'));
const index = read('index.html');
const main = read('src/main.ts');
const css = read('src/styles.css');
const sw = read('public/sw.js');
const difficulty = read('src/game/difficulty.js');
const pages = read('.github/workflows/github-pages.yml');
const quality = read('.github/workflows/quality-check.yml');
const errors = [];
const has = (text, token, label) => { if (!text.includes(token)) errors.push(`Missing ${label}: ${token}`); };

if (pkg.version !== '1.0.63') errors.push(`package version must be 1.0.63, got ${pkg.version}`);
if (!pkg.scripts['check:daily-quest-chain']) errors.push('missing package script check:daily-quest-chain');
for (const token of ['v1063-daily-quest-chain', 'v1063-boss-attack-readability', 'v1063-reward-flow-polish']) {
  has(index, token, 'index v1.0.63 token');
  has(main, token, 'main v1.0.63 token');
  has(css, token, 'css v1.0.63 token');
}
has(index, 'id="daily-quest-chain"', 'daily quest chain element');
has(index, 'id="boss-attack-preview"', 'boss attack preview element');
has(index, 'id="reward-flow-next"', 'reward next-flow element');
has(main, 'function renderDailyQuestChain', 'daily quest chain renderer');
has(main, 'function syncBossAttackPreview', 'boss attack preview sync');
has(main, 'getBossAttackPreview(reason', 'boss attack preview model');
has(main, 'el.rewardFlowNext', 'reward flow next binding');
has(main, 'document.body.dataset.rewardFlowPolish', 'reward flow body dataset');
has(css, '.daily-quest-chain[data-daily-quest-chain="v1063-daily-quest-chain"]', 'daily quest chain CSS');
has(css, '.boss-attack-preview[data-boss-attack-readability="v1063-boss-attack-readability"]', 'boss attack preview CSS');
has(css, '.reward-flow-next[data-reward-flow-polish="v1063-reward-flow-polish"]', 'reward flow next CSS');
has(sw, 'dream-library-cache-v1.0.63', 'service worker v1.0.63 cache');
has(sw, 'texture-atlas-manifest-v1.0.63.json', 'service worker v1.0.63 atlas preload');
has(difficulty, 'texture-atlas-manifest-v1.0.63.json', 'difficulty v1.0.63 atlas preload');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.63.json')) errors.push('missing v1.0.63 texture atlas manifest');
has(pages, 'npm run check:daily-quest-chain', 'GitHub Pages v1.0.63 QA hook');
has(quality, 'npm run check:daily-quest-chain', 'Quality v1.0.63 QA hook');
for (const forbidden of ['<svg', 'DELETE_REMOVED', 'Display Assist', 'Frame Lock', 'Virtual Frame', 'Kakao Browser', '보기 맞춤', '중앙으로']) {
  if (index.includes(forbidden) || main.includes(forbidden) || css.includes(forbidden)) errors.push(`forbidden token remains: ${forbidden}`);
}
if (main.includes('requestFullscreen()') || main.includes('screen.orientation.lock(')) errors.push('automatic fullscreen/orientation lock must not be added');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Daily quest chain QA check passed: v1.0.63 quest chain, boss attack readability and reward flow polish are wired.');
