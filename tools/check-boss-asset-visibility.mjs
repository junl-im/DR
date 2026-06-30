import { existsSync, readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const pkg = readFileSync('package.json', 'utf8');
const sw = readFileSync('public/sw.js', 'utf8');
const workflows = readFileSync('.github/workflows/github-pages.yml', 'utf8') + '\n' + readFileSync('.github/workflows/quality-check.yml', 'utf8');
const errors = [];

for (const asset of [
  'public/assets/characters/forgotten-spirit.png',
  'public/assets/characters/shadow-librarian.png',
  'public/assets/characters/sealed-page-golem.png',
  'public/assets/atlas/boss-frames-v2.png',
  'public/assets/atlas/boss-frames-v2.webp'
]) {
  if (!existsSync(asset)) errors.push(`Missing boss display asset: ${asset}`);
}
for (const token of [
  'data-boss-asset-guard="stable-fallback"',
  'data-boss-img-guard="stable"',
  'assets/atlas/boss-frames-v2.png',
  'assets/atlas/boss-frames-v2.webp'
]) {
  if (!html.includes(token)) errors.push(`HTML missing boss asset visibility token: ${token}`);
}
for (const token of [
  'BOSS_IMAGE_FALLBACK_SRC',
  'preloadBossAtlasImage',
  'setBossStableImage',
  "boss.asset || BOSS_IMAGE_FALLBACK_SRC",
  "dataset.bossAssetGuard = 'stable-fallback'",
  "dataset.bossAtlasReady = 'fallback'"
]) {
  if (!main.includes(token)) errors.push(`Runtime missing boss fallback guard token: ${token}`);
}
if (main.includes('const src = boss.frames?.[stateName]')) errors.push('Boss DOM image must not depend on motion frame images; use stable boss asset and atlas overlay.');
if (main.includes('el.bossImage.src = boss.frames?.idle')) errors.push('Boss panel must not boot from motion frame image.');
for (const token of [
  '.boss-core.boss-atlas-ready img { opacity: 1; }',
  'boss-atlas-ready .boss-atlas-sprite { opacity: 0.72; }',
  'data-boss-asset-guard="stable-fallback"',
  'data-boss-atlas-ready="fallback"'
]) {
  if (!css.includes(token)) errors.push(`CSS missing boss visibility fallback token: ${token}`);
}
if (!pkg.includes('"version": "1.0.47"') && !pkg.includes('"version": "1.0.48"') && (!pkg.includes('"version": "1.0.49"') && !pkg.includes('"version": "1.0.51"') && !pkg.includes('"version": "1.0.52"') && (!pkg.includes('"version": "1.0.53"') && (!pkg.includes('"version": "1.0.54"') && (!pkg.includes('"version": "1.0.55"') && (!pkg.includes('"version": "1.0.56"') && (!pkg.includes('"version": "1.0.57"') && (!pkg.includes('"version": "1.0.58"') && (!pkg.includes('"version": "1.0.59"') && (!pkg.includes('"version": "1.0.60"') && (!pkg.includes('"version": "1.0.61"') && (!pkg.includes('"version": "1.0.62"') && !pkg.includes('"version": "1.0.63"') && !pkg.includes('"version": "1.0.64"') && (!pkg.includes('"version": "1.0.65"') && (!pkg.includes('"version": "1.0.66"') && (!pkg.includes('"version": "1.0.67"') && !pkg.includes('"version": "1.0.68"')))))))))))))))) errors.push('package.json version must be 1.0.47, 1.0.48, 1.0.49 or 1.0.50.');
if (!pkg.includes('check:boss-asset-visibility')) errors.push('package.json must expose check:boss-asset-visibility.');
if (!sw.includes('dream-library-cache-v1.0.47') || !sw.includes('texture-atlas-manifest-v1.0.47.json')) errors.push('service worker cache/manifest must be v1.0.47.');
if (!workflows.includes('npm run check:boss-asset-visibility')) errors.push('workflows must run boss asset visibility check.');
for (const banned of ['board-minimap', '보드 레이더', '레이더 탭', '보기 맞춤', '드래그 이동']) {
  if (`${html}\n${main}\n${css}`.includes(banned)) errors.push(`Removed UI/minimap token came back: ${banned}`);
}

if (errors.length) {
  console.error(`Boss asset visibility check failed: ${errors.join('; ')}`);
  process.exit(1);
}
console.log('Boss asset visibility check passed: stable monster art remains visible with atlas fallback and no removed UI returned.');
