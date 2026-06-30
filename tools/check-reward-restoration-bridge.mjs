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

if (!['1.0.67', '1.0.68', '1.0.69', '1.0.70', '1.0.71', '1.0.72'].includes(pkg.version)) errors.push(`package version must be 1.0.67, got ${pkg.version}`);
if (!pkg.scripts['check:reward-restoration-bridge']) errors.push('missing package script check:reward-restoration-bridge');
for (const token of ['v1067-restoration-reward-bridge', 'v1067-boss-vfx-density-guard', 'v1067-micro-tutorial-comfort', 'dream-library-cache-v1.0.67', 'texture-atlas-manifest-v1.0.67.json']) {
  has(index + main + css + sw + difficulty, token, 'v1.0.67 token');
}
has(index, 'id="reward-restoration-bridge"', 'reward restoration bridge markup');
has(index, 'id="reward-restoration-button"', 'reward restoration action button');
has(main, 'function openRewardRestorationBridge', 'reward restoration action runtime');
has(main, 'el.rewardRestorationButton?.addEventListener', 'reward restoration action binding');
has(main, 'dataset.bridgeState', 'reward bridge state runtime');
has(main, 'dataset.bossVfxDensityGuard', 'boss VFX density runtime');
has(main, 'guide.dataset.guideMode', 'repeat tutorial comfort runtime');
has(main, 'softRepeat ? 2800 : 5200', 'short repeat tutorial timer');
has(css, '.reward-restoration-bridge[data-restoration-reward-bridge="v1067-restoration-reward-bridge"]', 'reward bridge CSS');
has(css, '.boss-attack-preview[data-boss-vfx-density-guard="v1067-boss-vfx-density-guard"]', 'boss VFX density CSS');
has(css, '.first-touch-guide[data-micro-tutorial-comfort="v1067-micro-tutorial-comfort"][data-guide-mode="soft-repeat"]', 'soft repeat tutorial CSS');
has(sw, "dream-library-cache-v1.0.67", 'service worker v1.0.67 cache');
has(sw, 'texture-atlas-manifest-v1.0.67.json', 'service worker v1.0.67 atlas preload');
if (!difficulty.includes('texture-atlas-manifest-v1.0.67.json') && !difficulty.includes('texture-atlas-manifest-v1.0.68.json')) errors.push('difficulty v1.0.67/v1.0.68 atlas preload missing');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.67.json')) errors.push('missing v1.0.67 texture atlas manifest');
has(pages, 'npm run check:reward-restoration-bridge', 'GitHub Pages v1.0.67 QA hook');
has(quality, 'npm run check:reward-restoration-bridge', 'Quality v1.0.67 QA hook');
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
console.log('Reward restoration bridge QA check passed: v1.0.67 connects clear rewards to restoration, softens boss VFX, and keeps repeat tutorial comfortable.');
