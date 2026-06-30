import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const read = (file) => readFileSync(file, 'utf8');
const pkg = JSON.parse(read('package.json'));
const index = read('index.html');
const main = read('src/main.ts');
const css = read('src/styles.css');
const sw = read('public/sw.js');
const difficulty = read('src/game/difficulty.js');
const pages = read('.github/workflows/github-pages.yml');
const quality = read('.github/workflows/quality-check.yml');
const errors = [];
const has = (source, token, label) => { if (!source.includes(token)) errors.push(`Missing ${label}: ${token}`); };

if (!['1.0.68', '1.0.69', '1.0.70', '1.0.71', '1.0.72'].includes(pkg.version)) errors.push(`package version must be 1.0.68, got ${pkg.version}`);
if (!pkg.scripts['check:restoration-theater-next-goal']) errors.push('missing package script check:restoration-theater-next-goal');
for (const token of ['v1068-restoration-completion-theater', 'v1068-reward-claim-motion', 'v1068-next-goal-advisor', 'v1068-boss-warning-icon-trim', 'dream-library-cache-v1.0.68', 'texture-atlas-manifest-v1.0.68.json']) {
  has(index + main + css + sw + difficulty, token, 'v1.0.68 token');
}
has(index, 'id="reward-completion-theater"', 'restoration completion theater markup');
has(index, 'id="reward-next-goal"', 'next goal advisor markup');
has(index, 'id="reward-next-goal-button"', 'next goal advisor action button');
has(index, 'data-boss-warning-icon-trim="v1068-boss-warning-icon-trim"', 'boss warning icon trim markup');
has(main, 'function triggerRestorationCompletionTheater', 'restoration completion theater runtime');
has(main, 'function renderRewardNextGoalAdvisor', 'next goal advisor runtime');
has(main, 'function openRewardNextGoalAdvisor', 'next goal advisor action runtime');
has(main, 'el.rewardNextGoalButton?.addEventListener', 'next goal action binding');
has(main, 'dataset.rewardClaimMotion', 'reward claim motion runtime');
has(main, 'dataset.iconTrim', 'boss warning icon trim runtime');
has(css, '.reward-completion-theater[data-restoration-completion-theater="v1068-restoration-completion-theater"]', 'restoration theater CSS');
has(css, '.reward-modal.reward-claim-pop[data-reward-claim-motion="v1068-reward-claim-motion"]', 'reward claim motion CSS');
has(css, '.reward-next-goal[data-next-goal-advisor="v1068-next-goal-advisor"]', 'next goal advisor CSS');
has(css, '.boss-attack-preview[data-boss-warning-icon-trim="v1068-boss-warning-icon-trim"]', 'boss warning icon trim CSS');
has(sw, 'dream-library-cache-v1.0.68', 'service worker v1.0.68 cache');
has(sw, 'texture-atlas-manifest-v1.0.68.json', 'service worker v1.0.68 atlas preload');
has(difficulty, 'texture-atlas-manifest-v1.0.68.json', 'difficulty v1.0.68 atlas preload');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.68.json')) errors.push('missing v1.0.68 texture atlas manifest');
has(pages, 'npm run check:restoration-theater-next-goal', 'GitHub Pages v1.0.68 QA hook');
has(quality, 'npm run check:restoration-theater-next-goal', 'Quality v1.0.68 QA hook');
const htmlTags = index.match(/<[^!][^>]*>/g) || [];
for (const tag of htmlTags) {
  const attrs = [...tag.matchAll(/\s([a-zA-Z_:][-\w:.]*)=/g)].map((m) => m[1]);
  const dup = attrs.find((attr, i) => attrs.indexOf(attr) !== i);
  if (dup) errors.push(`duplicate HTML attribute found: ${dup} in ${tag.slice(0, 120)}`);
}
if ((main.match(/guide\.innerHTML =/g) || []).length !== 1) errors.push('first touch guide should assign innerHTML exactly once');
for (const forbidden of ['Display Assist', 'Frame Lock', 'Virtual Frame', 'Kakao Browser', '보기 맞춤', '중앙으로', 'DELETE_REMOVED']) {
  if (index.includes(forbidden) || main.includes(forbidden) || css.includes(forbidden)) errors.push(`forbidden visible/debug copy found: ${forbidden}`);
}
if (index.includes('signal-finger') || index.includes('☝') || index.includes('👆')) errors.push('finger start cue must remain removed from HTML');
try {
  execFileSync('node', ['tools/check-no-svg.mjs'], { stdio: 'pipe' });
} catch {
  errors.push('SVG policy check failed');
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Restoration theater next goal QA check passed: v1.0.68 improves completion theater, reward motion, next goal advisor, and boss warning icon trim.');
