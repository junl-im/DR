import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const errors = [];
const requiredFiles = [
  'src/systems/performance.ts',
  'src/systems/haptics.ts',
  'public/assets/characters/forgotten-spirit.png',
  'public/assets/effects/combo-flash.png',
  'public/assets/effects/magic-wave.png',
  'public/assets/ui/hp-frame.png',
  'public/assets/meta/restoration-shelf.png',
  'public/assets/meta/daily-badge.png',
  'public/assets/meta/browser-handoff.png'
];

for (const file of requiredFiles) {
  try { statSync(join(root, file)); } catch { errors.push(`Missing required v1.0.9 file: ${file}`); }
}

const html = readFileSync(join(root, 'index.html'), 'utf8');
for (const id of ['mission-label', 'modifier-strip', 'combo-cutin', 'boss-hp-fill', 'quality-toggle', 'daily-stage-button', 'continue-inapp-button']) {
  if (!html.includes(`id="${id}"`)) errors.push(`Missing required UI hook: ${id}`);
}

const css = readFileSync(join(root, 'src/styles.css'), 'utf8');
for (const selector of ['.mission-strip', '.combo-cutin', '.boss-hp-meter', 'body[data-quality="low"]']) {
  if (!css.includes(selector)) errors.push(`Missing required style selector: ${selector}`);
}

const svgFiles = [];
walk(root, (file) => { if (file.toLowerCase().endsWith('.svg')) svgFiles.push(file); });
if (svgFiles.length) errors.push(`SVG files are forbidden: ${svgFiles.join(', ')}`);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Project health check passed for v1.0.9.');

function walk(dir, visitor) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git' || entry === 'dist') continue;
    const file = join(dir, entry);
    const stat = statSync(file);
    if (stat.isDirectory()) walk(file, visitor);
    else visitor(file);
  }
}
