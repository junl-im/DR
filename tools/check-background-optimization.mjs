import { statSync, readFileSync } from 'node:fs';

const errors = [];
const backgrounds = ['moon-library-v2', 'gothic-window-v2', 'bookshelf-v2'];
for (const name of backgrounds) {
  const png = `public/assets/backgrounds/${name}.png`;
  const webp = `public/assets/backgrounds/${name}.webp`;
  try {
    const pngSize = statSync(png).size;
    const webpSize = statSync(webp).size;
    if (webpSize >= pngSize) errors.push(`${webp} is not smaller than PNG fallback`);
  } catch {
    errors.push(`Missing optimized background pair for ${name}`);
  }
}
const main = readFileSync('src/main.ts', 'utf8');
const difficulty = readFileSync('src/game/difficulty.js', 'utf8');
const sw = readFileSync('public/sw.js', 'utf8');
if (!main.includes('image-set(') || !main.includes('backgroundImageSet')) errors.push('main.ts must use WebP/PNG image-set background fallback');
for (const name of backgrounds) {
  if (!difficulty.includes(`assets/backgrounds/${name}.webp`)) errors.push(`PRELOAD_ASSETS missing ${name}.webp`);
  if (!sw.includes(`assets/backgrounds/${name}.webp`)) errors.push(`service worker missing ${name}.webp`);
}
if (errors.length) {
  console.error(`Background optimization policy failed: ${errors.join('; ')}.`);
  process.exit(1);
}
console.log('Background optimization policy passed: WebP candidates, PNG fallbacks and cache/preload hooks are present.');
