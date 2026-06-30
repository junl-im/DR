import { readFileSync, existsSync } from 'node:fs';
const read = (path) => readFileSync(path, 'utf8');
const pkg = JSON.parse(read('package.json'));
const main = read('src/main.ts');
const renderer = read('src/rendering/DreamPixiRenderer.ts');
const index = read('index.html');
const css = read('src/styles.css');
const sw = read('public/sw.js');
const difficulty = read('src/game/difficulty.js');
const pages = read('.github/workflows/github-pages.yml');
const quality = read('.github/workflows/quality-check.yml');
const errors = [];
const has = (text, token, label) => { if (!text.includes(token)) errors.push(`Missing ${label}: ${token}`); };

if (!['1.0.56', '1.0.57', '1.0.58', '1.0.59', '1.0.60', '1.0.61', '1.0.62', '1.0.63', '1.0.64', '1.0.65', '1.0.66', '1.0.67', '1.0.68', '1.0.69', '1.0.70'].includes(pkg.version)) errors.push(`package version must be 1.0.56, got ${pkg.version}`);
if (!pkg.scripts['check:reward-detail-touch-qa']) errors.push('missing package script check:reward-detail-touch-qa');

for (const token of ['v1056-reward-detail-showcase', 'v1056-boss-warning-readability', 'v1056-real-device-touch-qa']) {
  has(main, token, 'main v1.0.56 token');
  has(css, token, 'css v1.0.56 token');
  has(index, token, 'index v1.0.56 token');
}

has(main, 'data-reward-detail-showcase', 'season shop reward detail dataset');
has(main, 'el.restorationDetailModal.dataset.detailMode', 'reward detail modal mode');
has(main, '복원으로 보기', 'reward detail modal CTA copy');
has(main, 'function applyBossWarningReadability', 'boss warning readability helper');
has(renderer, 'BOSS_WARNING_READABILITY_PATCH', 'renderer boss warning readability token');
has(renderer, 'readabilityWidthScale', 'boss warning lane width scaling');
has(css, 'reward-showcase-main', 'premium reward showcase CSS');
has(css, 'body.is-lobby-dragging[data-real-device-touch-qa="v1056-real-device-touch-qa"]', 'drag tap guard CSS');
has(sw, 'dream-library-cache-v1.0.56', 'service worker v1.0.56 cache');
has(sw, 'texture-atlas-manifest-v1.0.56.json', 'service worker v1.0.56 atlas preload');
has(difficulty, 'texture-atlas-manifest-v1.0.56.json', 'difficulty v1.0.56 atlas preload');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.56.json')) errors.push('missing v1.0.56 texture atlas manifest');
has(pages, 'npm run check:reward-detail-touch-qa', 'GitHub Pages reward detail QA hook');
has(quality, 'npm run check:reward-detail-touch-qa', 'Quality reward detail QA hook');

for (const forbidden of ['<svg', 'DELETE_REMOVED', 'Display Assist', 'Frame Lock', '드래그 이동 도움말', 'board radar', '보기 맞춤', '중앙으로']) {
  if (index.includes(forbidden) || main.includes(forbidden) || css.includes(forbidden)) errors.push(`forbidden token remains: ${forbidden}`);
}

if (errors.length) {
  console.error(`Reward detail touch QA check failed: ${errors.join('; ')}`);
  process.exit(1);
}
console.log('Reward detail touch QA check passed: v1.0.56 reward showcase, boss warning readability and touch guards are active.');
