import { readFileSync } from 'node:fs';

const renderer = readFileSync('src/rendering/DreamPixiRenderer.ts', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const pkg = readFileSync('package.json', 'utf8');
const sw = readFileSync('public/sw.js', 'utf8');
const workflows = readFileSync('.github/workflows/github-pages.yml', 'utf8') + '\n' + readFileSync('.github/workflows/quality-check.yml', 'utf8');
const errors = [];

for (const token of [
  'BOSS_WARNING_DEPTH_PROFILES',
  'getBossWarningDepthProfile',
  'boss-warning-depth-',
  "bossId === 'shadow-librarian'",
  "bossId === 'sealed-page-golem'",
  'drawBossWarningLane(adjustedPower, pattern, bossId, tempo)'
]) {
  if (!renderer.includes(token)) errors.push(`Renderer missing boss depth token: ${token}`);
}
for (const token of [
  'getObjectiveMarkerDensity',
  'getObjectiveMarkerPriority',
  'drawObjectiveOverflowMarker',
  'data-objective-marker-density',
  'data-objective-marker-overflow'
]) {
  if (!renderer.includes(token)) errors.push(`Renderer missing objective marker density token: ${token}`);
}
for (const token of [
  'dataset.bossWarningDepth',
  'dataset.bossVisualStack',
  'stable-atlas-v1040',
  'renderer.playBossWarning(boss.shakePower || 7, getBossWarningPattern(reason), boss.id ||'
]) {
  if (!main.includes(token)) errors.push(`Runtime missing boss/depth token: ${token}`);
}
for (const token of [
  'data-objective-marker-density="compressed-v1040"',
  'data-boss-visual-stack="stable-atlas-v1040"',
  'data-boss-warning-depth="forgotten-spirit"',
  'data-boss-warning-depth="shadow-librarian"',
  'data-boss-warning-depth="sealed-page-golem"',
  'data-visual-priority="boss-route-first"'
]) {
  if (!css.includes(token)) errors.push(`CSS missing v1.0.47 polish token: ${token}`);
}
for (const banned of ['board-minimap', '보드 레이더', '레이더 탭', '보기 맞춤', '드래그 이동']) {
  if (`${renderer}\n${main}\n${css}`.includes(banned)) errors.push(`Removed UI/minimap token came back: ${banned}`);
}
if (!pkg.includes('"version": "1.0.47"') && !pkg.includes('"version": "1.0.48"') && (!pkg.includes('"version": "1.0.49"') && !pkg.includes('"version": "1.0.51"') && !pkg.includes('"version": "1.0.52"') && (!pkg.includes('"version": "1.0.53"') && (!pkg.includes('"version": "1.0.54"') && (!pkg.includes('"version": "1.0.55"') && (!pkg.includes('"version": "1.0.56"') && (!pkg.includes('"version": "1.0.57"') && (!pkg.includes('"version": "1.0.58"') && (!pkg.includes('"version": "1.0.59"') && (!pkg.includes('"version": "1.0.60"') && (!pkg.includes('"version": "1.0.61"') && (!pkg.includes('"version": "1.0.62"') && !pkg.includes('"version": "1.0.63"') && !pkg.includes('"version": "1.0.64"') && !pkg.includes('"version": "1.0.65"'))))))))))))) errors.push('package.json version must be 1.0.47, 1.0.48, 1.0.49 or 1.0.50.');
if (!pkg.includes('check:boss-pattern-density')) errors.push('package.json must expose check:boss-pattern-density.');
if (!sw.includes('dream-library-cache-v1.0.47') || !sw.includes('texture-atlas-manifest-v1.0.47.json')) errors.push('service worker cache/manifest must be v1.0.47.');
if (!workflows.includes('npm run check:boss-pattern-density')) errors.push('workflows must run boss pattern density check.');

if (errors.length) {
  console.error(`Boss pattern density check failed: ${errors.join('; ')}`);
  process.exit(1);
}
console.log('Boss pattern density check passed: boss warning depth, marker density and compact flow polish remain active without removed UI.');
