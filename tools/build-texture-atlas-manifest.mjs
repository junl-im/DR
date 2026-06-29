import { readdirSync, statSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const assetRoot = join(root, 'public', 'assets');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const currentVersion = pkg.version || '1.0.65';
const entries = [];
const allowed = new Set(['.png', '.jpg', '.jpeg', '.webp', '.json']);
walk(assetRoot);
const manifest = {
  version: currentVersion,
  policy: 'PNG/WebP/JPG only. SVG is forbidden.',
  atlasStrategy: 'v2 state tiles are packed into public/assets/atlas/v2-tiles.png and looked up before individual authoring PNGs. Boss frame sheets are packed into public/assets/atlas/boss-frames-v2.png and rendered through the DOM atlas sprite and Pixi boss layer candidate paths, with WebP compression candidates cached for lightweight delivery.',
  total: entries.length,
  generatedAt: new Date().toISOString(),
  entries
};
mkdirSync(join(assetRoot, 'meta'), { recursive: true });
writeFileSync(join(assetRoot, 'meta', `texture-atlas-manifest-v${currentVersion}.json`), JSON.stringify(manifest, null, 2));
console.log(`Texture atlas manifest written with ${entries.length} entries.`);

function walk(dir) {
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full);
      continue;
    }
    const lower = entry.toLowerCase();
    const ext = lower.slice(lower.lastIndexOf('.'));
    if (!allowed.has(ext)) continue;
    entries.push({ file: relative(join(root, 'public'), full).replaceAll('\\', '/'), bytes: stat.size });
  }
}
