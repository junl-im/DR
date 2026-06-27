import { existsSync, readFileSync } from 'node:fs';

const atlasJson = 'public/assets/atlas/v2-state-tiles.atlas.json';
const atlasPng = 'public/assets/atlas/v2-state-tiles.png';
if (!existsSync(atlasJson) || !existsSync(atlasPng)) {
  console.error('Packed atlas assets are missing. Regenerate v2-state-tiles.png and v2-state-tiles.atlas.json before release.');
  process.exit(1);
}
const atlas = JSON.parse(readFileSync(atlasJson, 'utf8'));
const frameCount = Object.keys(atlas.frames || {}).length;
if (frameCount < 180) {
  console.error(`Packed atlas is incomplete: ${frameCount}/180 frames.`);
  process.exit(1);
}
console.log(`Packed v2 atlas already present: ${frameCount} frames. No SVG or runtime packing required.`);
