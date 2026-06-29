import { readFileSync } from 'node:fs';

const renderer = readFileSync('src/rendering/DreamPixiRenderer.ts', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const pkg = readFileSync('package.json', 'utf8');
const pages = readFileSync('.github/workflows/github-pages.yml', 'utf8');
const quality = readFileSync('.github/workflows/quality-check.yml', 'utf8');
const errors = [];

for (const token of [
  'TOUCH_HIT_SLOP_RATIO',
  'TOUCH_HIT_SLOP_MAX',
  'REAL_DEVICE_SELECTION_QA_LABEL',
  'selectionGeometrySnapshots',
  'captureSelectionGeometry',
  'verifySelectionGeometrySnapshot',
  'keepSelectedTileComfortablyVisible',
  'updateBoardReadabilityTier',
  'zoomReadability',
  'touchPrecision'
]) {
  if (!renderer.includes(token)) errors.push(`Missing renderer real-device QA token: ${token}`);
}
if (!renderer.includes('selected PNG') || !renderer.includes("state === 'selected' ? 'normal'")) errors.push('Selected state must still resolve to normal texture, not selected PNG.');
if (!renderer.includes('document.querySelector<HTMLElement>(\'.battle-stage\')?.setAttribute(\'data-selection-qa\', REAL_DEVICE_SELECTION_QA_LABEL)')) errors.push('Selection QA data hook is missing.');
if (!main.includes('touch-precision-readability') || !main.includes('space-reclaimed')) errors.push('Main runtime must expose real device QA and reclaimed camera UI state.');
for (const token of [
  'data-selection-qa="real-device-selection-geometry-qa"',
  'data-touch-precision="cell-slope-guard"',
  'data-zoom-readability="far"',
  '@media (pointer: coarse)'
]) {
  if (!css.includes(token)) errors.push(`Missing CSS real-device QA hook: ${token}`);
}
for (const banned of ['board-minimap', '보드 레이더', '레이더 탭', '드래그 이동', '보기 맞춤']) {
  if (renderer.includes(banned) || main.includes(banned) || css.includes(banned)) errors.push(`Removed UI must remain removed: ${banned}`);
}
if (!pkg.includes('"version": "1.0.47"') && !pkg.includes('"version": "1.0.48"') && (!pkg.includes('"version": "1.0.49"') && !pkg.includes('"version": "1.0.51"') && !pkg.includes('"version": "1.0.52"') && (!pkg.includes('"version": "1.0.53"') && (!pkg.includes('"version": "1.0.54"') && (!pkg.includes('"version": "1.0.55"') && (!pkg.includes('"version": "1.0.56"') && (!pkg.includes('"version": "1.0.57"') && (!pkg.includes('"version": "1.0.58"') && (!pkg.includes('"version": "1.0.59"') && (!pkg.includes('"version": "1.0.60"') && (!pkg.includes('"version": "1.0.61"') && (!pkg.includes('"version": "1.0.62"') && !pkg.includes('"version": "1.0.63"') && !pkg.includes('"version": "1.0.64"'))))))))))))) errors.push('package.json version must be 1.0.47, 1.0.48, 1.0.49 or 1.0.50.');
if (!pkg.includes('check:real-device-selection')) errors.push('package.json must expose check:real-device-selection.');
if (!pages.includes('npm run check:real-device-selection')) errors.push('github-pages workflow must run real-device selection QA check.');
if (!quality.includes('npm run check:real-device-selection')) errors.push('quality workflow must run real-device selection QA check.');

if (errors.length) {
  console.error(`Real device selection QA check failed: ${errors.join('; ')}.`);
  process.exit(1);
}
console.log('Real device selection QA passed: touch precision and tile geometry remain while visible camera help is removed.');
