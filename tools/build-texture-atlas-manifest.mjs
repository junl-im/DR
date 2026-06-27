import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const VERSION = '1.0.20';
const root = process.cwd();
const assetRoot = join(root, 'public', 'assets');
const groups = ['objects', 'effects', 'ui', 'characters', 'atlas'];
const entries = [];

function walk(dir, group) {
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, group);
      continue;
    }
    if (!/\.(png|webp|jpg|jpeg|json)$/i.test(name)) continue;
    entries.push({ group, file: relative(join(root, 'public'), full).replaceAll('\\', '/'), bytes: stat.size });
  }
}

for (const group of groups) {
  const dir = join(assetRoot, group);
  walk(dir, group);
}
const manifest = {
  version: VERSION,
  policy: 'PNG/WebP/JPG only. SVG is forbidden.',
  atlasStrategy: 'v2 state tile atlas is loaded first. Individual PNGs remain as fallback and authoring sources.',
  packedAtlases: [
    'assets/atlas/dream-objects.png',
    'assets/atlas/v2-state-tiles.png'
  ],
  total: entries.length,
  generatedAt: new Date().toISOString(),
  entries
};
writeFileSync(join(assetRoot, 'meta', `texture-atlas-manifest-v${VERSION}.json`), JSON.stringify(manifest, null, 2));
console.log(`Texture atlas manifest v${VERSION} written with ${entries.length} entries.`);
