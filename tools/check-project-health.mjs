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
  'tools/report-image-size.mjs',
  'tools/check-workflows.mjs',
  'public/assets/meta/asset-import-v1.0.11.json',
  'public/assets/meta/texture-atlas-manifest-v1.0.23.json',
  'tools/build-texture-atlas-manifest.mjs',
  'public/assets/atlas/v2-tiles.png',
  'public/assets/atlas/v2-tiles.atlas.json',
  'public/assets/atlas/boss-frames-v2.png',
  'public/assets/atlas/boss-frames-v2.atlas.json',
  'tools/check-background-optimization.mjs',
  'public/assets/backgrounds/bookshelf-v2.webp',
  'public/assets/backgrounds/gothic-window-v2.webp',
  'public/assets/backgrounds/moon-library-v2.webp',
  'tools/check-real-atlas.mjs',
  'tools/check-touch-qa.mjs',
  'tools/check-boss-sheets.mjs',
  'tools/check-special-rules.mjs',
  'public/assets/backgrounds/imported-moon-library.png',
  'public/assets/objects/premium-01.png',
  'public/assets/objects/premium-24.png',
  'public/assets/ui/icon-back.png',
  'public/assets/effects/particles-01.png',
  'tools/check-lobby-missions.mjs',
  'tools/check-kakao-portrait.mjs',
  'tools/check-exit-scroll.mjs',
  'src/platform/portraitLock.js'
];

for (const file of requiredFiles) {
  try { statSync(join(root, file)); } catch { errors.push(`Missing required v1.0.23 file: ${file}`); }
}

const html = readFileSync(join(root, 'index.html'), 'utf8');
for (const id of ['mission-label', 'modifier-strip', 'combo-cutin', 'boss-hp-fill', 'boss-image', 'boss-pattern', 'chapter-tabs', 'collection-list', 'daily-leaderboard-list', 'restoration-detail-modal', 'continue-inapp-button', 'kakao-fullscreen-button', 'portrait-lock-overlay', 'exit-confirm-modal', 'exit-confirm-button', 'exit-cancel-button', 'exit-sleep-modal', 'exit-wake-button', 'boss-telegraph', 'lobby-mission-deck', 'lobby-deck-refresh-button']) {
  if (!html.includes(`id="${id}"`)) errors.push(`Missing required UI hook: ${id}`);
}

const css = readFileSync(join(root, 'src/styles.css'), 'utf8');
for (const selector of ['.mission-strip', '.combo-cutin', '.boss-hp-meter', '.chapter-tabs', '.collection-panel', '.daily-leaderboard-list', 'body[data-quality="low"]', '.exit-card', '.exit-sleep-modal', '.premium-asset-ribbon', '.boss-telegraph', '.mission-deck-panel', '.mission-card', 'html.kakao-runtime', '.portrait-lock-overlay']) {
  if (!css.includes(selector)) errors.push(`Missing required style selector: ${selector}`);
}

const svgFiles = [];
walk(root, (file) => { if (file.toLowerCase().endsWith('.svg')) svgFiles.push(file); });
if (svgFiles.length) errors.push(`SVG files are forbidden: ${svgFiles.join(', ')}`);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Project health check passed for v1.0.23.');

function walk(dir, visitor) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git' || entry === 'dist') continue;
    const file = join(dir, entry);
    const stat = statSync(file);
    if (stat.isDirectory()) walk(file, visitor);
    else visitor(file);
  }
}
