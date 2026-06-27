import { readFileSync, existsSync } from 'node:fs';

const renderer = readFileSync('src/rendering/DreamPixiRenderer.ts', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const pkg = readFileSync('package.json', 'utf8');
const sw = readFileSync('public/sw.js', 'utf8');
const workflows = readFileSync('.github/workflows/github-pages.yml', 'utf8') + '\n' + readFileSync('.github/workflows/quality-check.yml', 'utf8');
const runtime = `${renderer}\n${main}\n${css}`;
const errors = [];

for (const token of [
  'MOBILE_BOARD_FEEL_PATCH',
  'v1040-mobile-board-feel',
  'large-soft-follow-v1040',
  'near-edge-only-v1040',
  'tile-contrast-natural-v1040',
  'boss-route-soft-v1040'
]) {
  if (!runtime.includes(token)) errors.push(`Missing mobile board feel token: ${token}`);
}
for (const token of [
  'playClearRewardFlow',
  'CLEAR_REWARD_FLOW_PATCH',
  'v1040-board-to-reward-flow',
  'v1040-clear-to-restoration',
  'materials-linked-v1040',
  'reward-chip-restore'
]) {
  if (!runtime.includes(token)) errors.push(`Missing clear reward bridge token: ${token}`);
}
for (const token of [
  'BOSS_VISUAL_STACK_PATCH',
  'stable-atlas-v1040',
  'v1040-stable-visible',
  'boss-asset-polish'
]) {
  if (!runtime.includes(token)) errors.push(`Missing boss asset polish token: ${token}`);
}
for (const banned of ['board-minimap', '보드 레이더', '레이더 탭', '보기 맞춤', '드래그 이동']) {
  if (runtime.includes(banned)) errors.push(`Removed UI/minimap token came back: ${banned}`);
}
if (!pkg.includes('"version": "1.0.46"')) errors.push('package.json version must be 1.0.46.');
if (!pkg.includes('check:mobile-board-reward-flow')) errors.push('package.json must expose check:mobile-board-reward-flow.');
if (!sw.includes('dream-library-cache-v1.0.46') || !sw.includes('texture-atlas-manifest-v1.0.46.json')) errors.push('service worker cache/manifest must be v1.0.46.');
if (!sw.includes('v1042-cache-slim-account-time-pressure')) errors.push('service worker cache slim policy must be v1042.');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.46.json')) errors.push('v1.0.46 texture atlas manifest file missing.');
if (!workflows.includes('npm run check:mobile-board-reward-flow')) errors.push('workflows must run v1.0.46 mobile board reward flow check.');

if (errors.length) {
  console.error(`Mobile board reward flow check failed: ${errors.join('; ')}`);
  process.exit(1);
}
console.log('Mobile board reward flow check passed: v1.0.46 mobile board feel, boss polish and reward bridge are active without removed UI.');
