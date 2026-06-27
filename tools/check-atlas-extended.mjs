import { readFileSync, statSync } from 'node:fs';

const renderer = readFileSync('src/rendering/DreamPixiRenderer.ts', 'utf8');
const difficulty = readFileSync('src/game/difficulty.js', 'utf8');
const sw = readFileSync('public/sw.js', 'utf8');
const checks = [
  [renderer.includes('resolveAssetTexture'), 'renderer asset texture resolver missing'],
  [renderer.includes("setAttribute('data-atlas'") || renderer.includes('setAttribute("data-atlas"'), 'battle-stage atlas state hook missing'],
  [renderer.includes('this.resolveAssetTexture(effectAsset(name))'), 'VFX texture resolver not used'],
  [renderer.includes('v2-fragments/v2-fragment') && renderer.includes('resolveAssetTexture'), 'fragment texture resolver not used'],
  [difficulty.includes('texture-atlas-manifest-v1.0.42.json'), 'v1.0.42 manifest not referenced'],
  [sw.includes('texture-atlas-manifest-v1.0.42.json') && sw.includes('dream-library-cache-v1.0.42'), 'service worker v1.0.42 cache/manifest missing']
];
for (const file of ['public/assets/atlas/v2-tiles.png', 'public/assets/atlas/v2-tiles.atlas.json', 'public/assets/atlas/boss-frames-v2.png', 'public/assets/atlas/boss-frames-v2.atlas.json', 'public/assets/meta/texture-atlas-manifest-v1.0.42.json']) {
  try { statSync(file); } catch { checks.push([false, `missing ${file}`]); }
}
const failed = checks.filter(([ok]) => !ok).map(([, msg]) => msg);
if (failed.length) {
  console.error(failed.join('\n'));
  process.exit(1);
}
console.log('Extended atlas lookup policy passed for v1.0.42.');
