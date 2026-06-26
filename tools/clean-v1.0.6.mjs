import { rm, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const removed = [];
const ignored = new Set(['.git', 'node_modules', 'dist']);

async function walk(dir) {
  for (const entry of await readdir(dir)) {
    if (ignored.has(entry)) continue;
    const file = path.join(dir, entry);
    const info = await stat(file);
    if (info.isDirectory()) await walk(file);
    else if (entry.toLowerCase().endsWith('.svg')) {
      await rm(file, { force: true });
      removed.push(path.relative(root, file));
    }
  }
}

await walk(root);
await rm(path.join(root, 'public/assets/tiles'), { recursive: true, force: true });
if (removed.length) {
  console.log('Removed legacy SVG files:');
  for (const file of removed) console.log(`- ${file}`);
} else {
  console.log('No legacy SVG files found.');
}
console.log('Removed public/assets/tiles if it existed.');
