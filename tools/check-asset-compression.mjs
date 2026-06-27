import { statSync, readFileSync } from 'node:fs';

const errors = [];
const pairs = [
  ['public/assets/atlas/v2-tiles.png', 'public/assets/atlas/v2-tiles.webp'],
  ['public/assets/atlas/boss-frames-v2.png', 'public/assets/atlas/boss-frames-v2.webp']
];
for (const [png, webp] of pairs) {
  try {
    const pngSize = statSync(png).size;
    const webpSize = statSync(webp).size;
    if (webpSize <= 0) errors.push(`${webp} is empty.`);
    if (webpSize >= pngSize) errors.push(`${webp} must be smaller than ${png}.`);
  } catch (error) {
    errors.push(`compression candidate missing: ${error.message}`);
  }
}
const difficulty = readFileSync('src/game/difficulty.js', 'utf8');
const sw = readFileSync('public/sw.js', 'utf8');
if (!difficulty.includes('ATLAS_WEBP_ASSETS') || !difficulty.includes('boss-frames-v2.webp') || !difficulty.includes('v2-tiles.webp')) errors.push('ATLAS_WEBP_ASSETS must include tile and boss WebP candidates.');
if (!sw.includes('v2-tiles.webp') || !sw.includes('boss-frames-v2.webp')) errors.push('service worker must cache atlas WebP candidates.');
if (errors.length) {
  console.error(`Asset compression policy failed: ${errors.join('; ')}`);
  process.exit(1);
}
console.log('Asset compression policy passed for v1.0.24.');
