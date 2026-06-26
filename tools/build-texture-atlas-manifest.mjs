import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const assetRoot = join(root, 'public', 'assets');
const groups = ['objects', 'effects', 'ui', 'characters'];
const entries = [];
for (const group of groups) {
  const dir = join(assetRoot, group);
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.png')).sort()) {
    const full = join(dir, file);
    const stat = statSync(full);
    entries.push({ group, file: relative(join(root, 'public'), full).replaceAll('\\', '/'), bytes: stat.size });
  }
}
const manifest = {
  version: '1.0.13',
  policy: 'PNG/WebP/JPG only. SVG is forbidden.',
  atlasStrategy: 'Prefer grouped object/effect/ui atlases after visual QA. Keep source PNGs as authoring assets.',
  total: entries.length,
  generatedAt: new Date().toISOString(),
  entries
};
writeFileSync(join(assetRoot, 'meta', 'texture-atlas-manifest-v1.0.13.json'), JSON.stringify(manifest, null, 2));
console.log(`Texture atlas manifest written with ${entries.length} entries.`);
