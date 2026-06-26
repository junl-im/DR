import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const errors = [];
const requiredFiles = [
  'src/systems/performance.ts',
  'src/systems/haptics.ts',
  'src/game/bosses.js',
  'public/assets/characters/forgotten-spirit.png',
  'public/assets/characters/shadow-librarian.png',
  'public/assets/characters/sealed-page-golem.png',
  'public/assets/effects/combo-flash.png',
  'public/assets/effects/magic-wave.png',
  'public/assets/ui/hp-frame.png',
  'public/assets/meta/restoration-shelf.png',
  'public/assets/meta/daily-badge.png',
  'public/assets/meta/browser-handoff.png',
  'public/assets/meta/collection-codex.png',
  'public/assets/ui/logo-art.png',
  'public/assets/ui/start-button-art.png',
  'public/assets/meta/asset-codex.png',
  'public/assets/meta/asset-pack-manifest.json',
  'public/assets/effects/particle-star.png',
  'tools/report-image-size.mjs',
  'tools/check-workflows.mjs'
];

for (const file of requiredFiles) {
  try { statSync(join(root, file)); } catch { errors.push(`Missing required v1.0.11 file: ${file}`); }
}

const html = readFileSync(join(root, 'index.html'), 'utf8');
for (const id of ['mission-label', 'modifier-strip', 'combo-cutin', 'boss-hp-fill', 'boss-image', 'boss-pattern', 'chapter-tabs', 'collection-list', 'daily-leaderboard-list', 'restoration-detail-modal', 'continue-inapp-button']) {
  if (!html.includes(`id="${id}"`)) errors.push(`Missing required UI hook: ${id}`);
}

const css = readFileSync(join(root, 'src/styles.css'), 'utf8');
for (const selector of ['.mission-strip', '.combo-cutin', '.boss-hp-meter', '.chapter-tabs', '.collection-panel', '.daily-leaderboard-list', '.asset-showcase-panel', '.premium-object-strip', 'body[data-quality="low"]']) {
  if (!css.includes(selector)) errors.push(`Missing required style selector: ${selector}`);
}

const svgFiles = [];
walk(root, (file) => { if (file.toLowerCase().endsWith('.svg')) svgFiles.push(file); });
if (svgFiles.length) errors.push(`SVG files are forbidden: ${svgFiles.join(', ')}`);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Project health check passed for v1.0.11.');

function walk(dir, visitor) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git' || entry === 'dist') continue;
    const file = join(dir, entry);
    const stat = statSync(file);
    if (stat.isDirectory()) walk(file, visitor);
    else visitor(file);
  }
}
