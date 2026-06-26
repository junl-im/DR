import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const criticalAssets = [
  'public/assets/ui/logo-dream-library-v2.png',
  'public/assets/ui/button-start-v2.png',
  'public/assets/ui/button-google-v2.png',
  'public/assets/ui/frame-ornate-v2.png',
  'public/assets/characters/mascot-scholar-v2.png',
  'public/assets/characters/mascot-companions-v2.png',
  'public/assets/characters/boss-motion-sheet-v2.png',
  'public/assets/characters/boss-sticker-sheet-v2.png',
  'public/assets/backgrounds/gothic-window-v2.png',
  'public/assets/backgrounds/bookshelf-v2.png',
  ...Array.from({ length: 36 }, (_, index) => `public/assets/objects/v2-state/v2-tile-${String(index + 1).padStart(2, '0')}-normal.png`),
  ...Array.from({ length: 36 }, (_, index) => `public/assets/objects/v2-state/v2-tile-${String(index + 1).padStart(2, '0')}-selected.png`)
];

function parsePng(file) {
  const data = readFileSync(file);
  if (data.toString('ascii', 1, 4) !== 'PNG') throw new Error(`${file} is not a PNG`);
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  const idat = [];
  while (offset < data.length) {
    const length = data.readUInt32BE(offset); offset += 4;
    const type = data.toString('ascii', offset, offset + 4); offset += 4;
    const chunk = data.subarray(offset, offset + length); offset += length + 4;
    if (type === 'IHDR') {
      width = chunk.readUInt32BE(0);
      height = chunk.readUInt32BE(4);
      bitDepth = chunk[8];
      colorType = chunk[9];
      interlace = chunk[12];
    }
    if (type === 'IDAT') idat.push(chunk);
    if (type === 'IEND') break;
  }
  if (bitDepth !== 8 || interlace !== 0) throw new Error(`${file} uses unsupported PNG encoding for QA`);
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 4 ? 2 : colorType === 0 ? 1 : 0;
  if (!channels) throw new Error(`${file} uses unsupported PNG color type ${colorType}`);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const rows = [];
  let pos = 0;
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[pos++];
    const row = Buffer.from(raw.subarray(pos, pos + stride));
    pos += stride;
    const bpp = channels;
    for (let x = 0; x < stride; x += 1) {
      const left = x >= bpp ? row[x - bpp] : 0;
      const up = prev[x] || 0;
      const upLeft = x >= bpp ? prev[x - bpp] : 0;
      if (filter === 1) row[x] = (row[x] + left) & 255;
      else if (filter === 2) row[x] = (row[x] + up) & 255;
      else if (filter === 3) row[x] = (row[x] + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        row[x] = (row[x] + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft)) & 255;
      } else if (filter !== 0) throw new Error(`${file} uses invalid filter ${filter}`);
    }
    rows.push(row);
    prev = row;
  }
  return { width, height, channels, rows };
}

function analyze(file) {
  const png = parsePng(file);
  if (png.channels !== 4) return { file, transparentRatio: 0, edgeTransparentRatio: 0 };
  let transparent = 0;
  let pixels = 0;
  let edgeTransparent = 0;
  let edgePixels = 0;
  for (let y = 0; y < png.height; y += 1) {
    const row = png.rows[y];
    for (let x = 0; x < png.width; x += 1) {
      const alpha = row[x * 4 + 3];
      const isTransparent = alpha < 245;
      transparent += isTransparent ? 1 : 0;
      pixels += 1;
      if (y === 0 || x === 0 || y === png.height - 1 || x === png.width - 1) {
        edgeTransparent += alpha < 30 ? 1 : 0;
        edgePixels += 1;
      }
    }
  }
  return { file, transparentRatio: transparent / pixels, edgeTransparentRatio: edgeTransparent / edgePixels };
}

const failures = [];
for (const file of criticalAssets) {
  const result = analyze(file);
  if (result.transparentRatio < 0.06 || result.edgeTransparentRatio < 0.38) {
    failures.push(`${file}: transparent=${result.transparentRatio.toFixed(3)}, edge=${result.edgeTransparentRatio.toFixed(3)}`);
  }
}
if (failures.length) {
  console.error(`Transparent asset QA failed:\n${failures.join('\n')}`);
  process.exit(1);
}
console.log('Transparent asset QA passed. Critical v2 cutout and gameplay tile assets have usable alpha.');
