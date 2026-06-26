import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const ignored = new Set(['.git', 'node_modules', 'dist']);
const found = [];

async function walk(dir) {
  for (const entry of await readdir(dir)) {
    if (ignored.has(entry)) continue;
    const file = path.join(dir, entry);
    const info = await stat(file);
    if (info.isDirectory()) await walk(file);
    else if (entry.toLowerCase().endsWith('.svg')) found.push(path.relative(root, file));
  }
}

await walk(root);
if (found.length) {
  console.error('SVG files are not allowed in 꿈의 서고. Remove these files:');
  for (const file of found) console.error(`- ${file}`);
  process.exit(1);
}
console.log('No SVG files found. Raster asset policy passed.');
