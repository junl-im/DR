import { readFileSync, statSync } from 'node:fs';

const errors = [];
for (const file of [
  'src/game/bossAtlas.js',
  'public/assets/atlas/boss-frames-v2.png',
  'public/assets/atlas/boss-frames-v2.webp',
  'public/assets/atlas/boss-frames-v2.atlas.json'
]) {
  try { statSync(file); } catch { errors.push(`missing ${file}`); }
}
const main = readFileSync('src/main.ts', 'utf8');
const html = readFileSync('index.html', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const atlasModule = readFileSync('src/game/bossAtlas.js', 'utf8');
if (!main.includes('getBossAtlasFrame') || !main.includes('applyBossAtlasFrame')) errors.push('main must apply boss atlas frame metadata.');
if (!main.includes('bossAtlasSprite') || !html.includes('boss-atlas-sprite')) errors.push('boss atlas sprite element is missing.');
if (!css.includes('.boss-atlas-sprite') || !css.includes('boss-atlas-ready')) errors.push('boss atlas sprite CSS is missing.');
if (!atlasModule.includes('BOSS_ATLAS_FRAMES') || !atlasModule.includes('BOSS_ATLAS_SHEET')) errors.push('boss atlas frame module is incomplete.');
if (!main.includes('--boss-frame-x') || !main.includes('--boss-frame-scale')) errors.push('boss frame CSS variable application is missing.');
if (errors.length) {
  console.error(`Boss atlas rendering policy failed: ${errors.join('; ')}`);
  process.exit(1);
}
console.log('Boss atlas rendering policy passed for v1.0.26.');
