import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const root = process.cwd();
const assetRoot = join(root, 'public', 'assets');
const images = [];
walk(assetRoot, (file) => {
  const ext = extname(file).toLowerCase();
  if (!['.png', '.webp', '.jpg', '.jpeg'].includes(ext)) return;
  const stat = statSync(file);
  const dimensions = ext === '.png' ? readPngSize(file) : null;
  images.push({ file: relative(root, file).replaceAll('\\', '/'), bytes: stat.size, dimensions });
});

images.sort((a, b) => b.bytes - a.bytes);
const total = images.reduce((sum, image) => sum + image.bytes, 0);
console.log(`Image size report: ${images.length} files, ${formatBytes(total)} total`);
images.slice(0, 18).forEach((image, index) => {
  const size = image.dimensions ? `${image.dimensions.width}x${image.dimensions.height}` : 'unknown';
  console.log(`${String(index + 1).padStart(2, '0')}. ${formatBytes(image.bytes).padStart(9)}  ${size.padEnd(10)}  ${image.file}`);
});

const oversized = images.filter((image) => image.bytes > 1_200_000);
console.log('\nMarkdown summary:');
console.log('| Rank | Size | Dimensions | File |');
console.log('|---:|---:|---:|---|');
images.slice(0, 10).forEach((image, index) => {
  const size = image.dimensions ? `${image.dimensions.width}x${image.dimensions.height}` : 'unknown';
  console.log(`| ${index + 1} | ${formatBytes(image.bytes)} | ${size} | ${image.file} |`);
});
if (oversized.length) {
  console.warn(`Large image warning: ${oversized.length} files exceed 1.2 MB. Consider WebP/atlas optimization later.`);
}

function walk(dir, visitor) {
  for (const entry of readdirSync(dir)) {
    const file = join(dir, entry);
    const stat = statSync(file);
    if (stat.isDirectory()) walk(file, visitor);
    else visitor(file);
  }
}

function readPngSize(file) {
  const buffer = readFileSync(file);
  if (buffer.length < 24 || buffer.toString('ascii', 1, 4) !== 'PNG') return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
