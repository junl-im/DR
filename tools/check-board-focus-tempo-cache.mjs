import { readFileSync } from 'node:fs';

const renderer = readFileSync('src/rendering/DreamPixiRenderer.ts', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const pkg = readFileSync('package.json', 'utf8');
const sw = readFileSync('public/sw.js', 'utf8');
const pages = readFileSync('.github/workflows/github-pages.yml', 'utf8');
const quality = readFileSync('.github/workflows/quality-check.yml', 'utf8');
const runtime = `${renderer}
${main}
${css}`;
const errors = [];

for (const token of [
  'BOARD_FOCUS_BALANCE_PATCH',
  'getBoardFocusProfile',
  'large-soft-follow',
  'getVisualPriorityState',
  'tile-contrast-first',
  'data-board-focus-balance'
]) {
  if (!renderer.includes(token) && !css.includes(token)) errors.push(`Missing board focus balance token: ${token}`);
}
for (const token of [
  'getBossWarningTempo',
  'cooldown-softened',
  'BOSS_FLOW_TEMPO_PATCH',
  'dataset.bossFlowTempo',
  'drawBossWarningLane(adjustedPower, pattern, bossId, tempo)'
]) {
  if (!renderer.includes(token)) errors.push(`Missing boss flow tempo token: ${token}`);
}
for (const token of [
  'compressed-v1040',
  'route-assist-priority-v1040',
  'data-objective-marker-density="compressed-v1040"',
  'data-boss-flow-tempo="cooldown-softened"'
]) {
  if (!runtime.includes(token)) errors.push(`Missing v1.0.47 visual priority token: ${token}`);
}
if (!main.includes('stable-atlas-v1040') || !css.includes('stable-atlas-v1040')) errors.push('Boss visual stack must be v1040.');
if (!pkg.includes('"version": "1.0.47"') && !pkg.includes('"version": "1.0.48"')) errors.push('package.json version must be 1.0.47 or 1.0.48.');
if (!pkg.includes('check:board-focus-tempo-cache')) errors.push('package.json must expose check:board-focus-tempo-cache.');
if (!sw.includes('dream-library-cache-v1.0.47') || !sw.includes('texture-atlas-manifest-v1.0.47.json')) errors.push('service worker cache/manifest must be v1.0.47.');
if (!sw.includes('CACHE_SLIM_POLICY') || !sw.includes('v1042-cache-slim-account-time-pressure')) errors.push('service worker cache slim policy missing.');
for (const heavy of ['asset-import-v1.0.11.json', 'asset-import-v1.0.17.json', 'boss-motion-sheet-v2.png', 'v2-tile-01-selected.png']) {
  if (sw.includes(heavy)) errors.push(`Slim cache should not preload low-priority asset: ${heavy}`);
}
if (!pages.includes('npm run check:board-focus-tempo-cache') || !quality.includes('npm run check:board-focus-tempo-cache')) errors.push('workflows must run v1.0.47 board focus tempo cache check.');
for (const banned of ['board-minimap', '보드 레이더', '레이더 탭', '보기 맞춤', '드래그 이동']) {
  if (runtime.includes(banned)) errors.push(`Removed UI/minimap token came back: ${banned}`);
}
if (errors.length) {
  console.error(`Board focus tempo cache check failed: ${errors.join('; ')}`);
  process.exit(1);
}
console.log('Board focus tempo cache check passed: board focus, boss tempo and slim cache v1.0.47 are active without removed UI.');
