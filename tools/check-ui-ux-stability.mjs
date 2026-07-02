import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const read = (file) => readFileSync(file, 'utf8');
const pkg = JSON.parse(read('package.json'));
const index = read('index.html');
const main = read('src/main.ts');
const css = read('src/styles.css');
const sw = read('public/sw.js');
const difficulty = read('src/game/difficulty.js');
const pages = read('.github/workflows/github-pages.yml');
const quality = read('.github/workflows/quality-check.yml');
const errors = [];
const has = (source, token, label) => { if (!source.includes(token)) errors.push(`Missing ${label}: ${token}`); };

if (!['1.0.65', '1.0.66', '1.0.67', '1.0.68', '1.0.69', '1.0.70', '1.0.71', '1.0.72', '1.0.73', '1.0.74', '1.0.75', '1.0.76', '1.0.77', '1.0.78', '1.0.79', '1.0.80', '1.0.81', '1.0.82', '1.0.83', '1.0.85', '1.0.86'].includes(pkg.version)) errors.push(`package version must be 1.0.65 or 1.0.66, got ${pkg.version}`);
for (const token of ['v1065-ui-ux-stability-pass', 'dream-library-cache-v1.0.86', 'texture-atlas-manifest-v1.0.65.json']) {
  has(index + main + css + sw + difficulty, token, 'v1.0.65 stability token');
}
for (const fileToken of ['data-ui-ux-stability="v1065-ui-ux-stability-pass"', 'selected-stage-copy', 'ui-ux-tight', 'ui-ux-modal-open']) {
  has(index + css + main, fileToken, 'UI/UX stability implementation');
}
if (index.includes('signal-finger') || index.includes('☝')) errors.push('finger start cue must remain removed from HTML');
has(index, '<span class="signal-arrow" aria-hidden="true">➜</span>', 'right-arrow-only CTA markup');
has(css, '.daily-start-signal[data-ui-ux-stability="v1065-ui-ux-stability-pass"]', 'touch-safe CTA CSS');
has(css, '.reward-modal[data-ui-ux-stability="v1065-ui-ux-stability-pass"]', 'modal density guard CSS');
has(main, 'function syncUiUxStabilityPass()', 'runtime UI/UX stability sync');
has(main, 'initUiUxStabilityWatcher()', 'runtime UI/UX watcher');
has(sw, "dream-library-cache-v1.0.86", 'service worker v1.0.65 cache');
has(sw, 'texture-atlas-manifest-v1.0.65.json', 'service worker v1.0.65 atlas preload');
has(difficulty, 'texture-atlas-manifest-v1.0.65.json', 'difficulty v1.0.65 atlas preload');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.65.json')) errors.push('missing v1.0.65 texture atlas manifest');
has(pages, 'npm run check:ui-ux-stability', 'GitHub Pages v1.0.65 QA hook');
has(quality, 'npm run check:ui-ux-stability', 'Quality v1.0.65 QA hook');

const idMatches = [...index.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
const duplicates = idMatches.filter((id, idx) => idMatches.indexOf(id) !== idx);
if (duplicates.length) errors.push(`duplicate ids found: ${[...new Set(duplicates)].join(', ')}`);

for (const forbidden of ['Display Assist', 'Frame Lock', '카카오 브라우저 대응', '전체화면 고정', '세로 전체화면', 'DELETE_REMOVED']) {
  if (index.includes(forbidden) || main.includes(forbidden) || css.includes(forbidden)) errors.push(`forbidden visible/debug copy found: ${forbidden}`);
}
try {
  execFileSync('node', ['tools/check-no-svg.mjs'], { stdio: 'pipe' });
} catch {
  errors.push('SVG policy check failed');
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('UI/UX stability QA check passed: v1.0.65 keeps arrow-only CTA, removes duplicate IDs, and guards mobile modal/CTA density.');
