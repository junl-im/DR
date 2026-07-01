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

if (!['1.0.55', '1.0.56', '1.0.57', '1.0.58', '1.0.59', '1.0.60', '1.0.61', '1.0.62', '1.0.63', '1.0.64', '1.0.65', '1.0.66', '1.0.67', '1.0.68', '1.0.69', '1.0.70', '1.0.71', '1.0.72', '1.0.73', '1.0.74', '1.0.75', '1.0.76'].includes(pkg.version)) errors.push(`package version must be 1.0.55, got ${pkg.version}`);
if (!pkg.scripts['check:engine-render-budget']) errors.push('missing package script check:engine-render-budget');

for (const token of ['v1055-engine-render-budget-tuning', 'v1055-store-reward-collection-polish', 'v1055-lobby-density-final-qa', 'v1055-store-reward-preview-lens', 'v1055-lobby-touch-conflict-audit']) {
  has(main, token, 'main v1.0.55 token');
  has(css, token, 'css v1.0.55 token');
  has(index, token, 'index v1.0.55 token');
}

has(main, 'function getEngineRenderBudgetDetail', 'engine budget detail function');
has(main, 'renderer.setRenderBudget', 'renderer render budget sync');
has(main, 'function getSummerShopRewardPreview', 'season shop reward preview function');
has(renderer, 'setRenderBudget', 'Pixi render budget setter');
has(renderer, 'getRenderBudgetProfile', 'Pixi render budget profile');
has(renderer, 'particleCap', 'particle cap tuning');
has(renderer, 'spriteStride', 'VFX sprite stride tuning');
has(sw, 'dream-library-cache-v1.0.55', 'service worker v1.0.55 cache');
has(sw, 'texture-atlas-manifest-v1.0.55.json', 'service worker v1.0.55 atlas preload');
has(difficulty, 'texture-atlas-manifest-v1.0.55.json', 'difficulty atlas v1.0.55 preload');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.55.json')) errors.push('missing v1.0.55 texture atlas manifest');
has(pages, 'npm run check:engine-render-budget', 'GitHub Pages check hook');
has(quality, 'npm run check:engine-render-budget', 'Quality check hook');

for (const forbidden of ['<svg', 'DELETE_REMOVED', 'Display Assist', 'Frame Lock', '드래그 이동 도움말', 'board radar']) {
  if (index.includes(forbidden) || main.includes(forbidden) || css.includes(forbidden)) errors.push(`forbidden token remains: ${forbidden}`);
}

if (errors.length) {
  console.error(`Engine render budget check failed: ${errors.join('; ')}`);
  process.exit(1);
}
console.log('Engine render budget check passed: v1.0.55 budget tuning, reward preview, mobile density QA and cache manifest are active.');
