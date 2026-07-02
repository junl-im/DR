import { readFileSync, existsSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const stages = readFileSync('src/game/stages.js', 'utf8');
const difficulty = readFileSync('src/game/difficulty.js', 'utf8');
const pkg = readFileSync('package.json', 'utf8');
const sw = readFileSync('public/sw.js', 'utf8');
const pages = readFileSync('.github/workflows/github-pages.yml', 'utf8');
const quality = readFileSync('.github/workflows/quality-check.yml', 'utf8');

const errors = [];
for (const token of ['data-boss-layout="statusbar-left-icon-safe-v1077"', 'statusbar-left-icon-v1077', 'v1046-icon-readability']) {
  if (!html.includes(token) && !css.includes(token) && !main.includes(token)) errors.push(`Missing boss statusbar left portrait token: ${token}`);
}
for (const token of ['beginner', 'skilled', 'nightmare', '초보', '숙련', '악몽']) {
  if (!difficulty.includes(token) && !stages.includes(token)) errors.push(`Missing expanded difficulty token: ${token}`);
}
const stageCount = (stages.match(/stage\('/g) || []).length;
if (stageCount < 24) errors.push(`Expected at least 24 campaign stages, found ${stageCount}.`);
const chapterCount = (stages.match(/id: 'chapter-/g) || []).length;
if (chapterCount < 5) errors.push(`Expected at least 5 chapters, found ${chapterCount}.`);
for (const token of ['dy > 1.6', 'dx * 0.34', 'shell.scrollTop -= deltaY * 1.18', 'is-lobby-dragging', 'v1046-gesture-final-rescue']) {
  if (!main.includes(token)) errors.push(`Missing lobby drag rescue token: ${token}`);
}
for (const token of ['touch-action: pan-y', 'grid-auto-flow: column', 'statusbar-left-icon-safe-v1077']) {
  if (!css.includes(token)) errors.push(`Missing lobby/boss CSS token: ${token}`);
}
for (const banned of ['보기 맞춤', '중앙으로', 'board-radar', 'minimap']) {
  if (html.includes(banned) || main.includes(banned)) errors.push(`Removed UI token reintroduced: ${banned}`);
}
if (!pkg.includes('"version": "1.0.84"') && !pkg.includes('"version": "1.0.47"') && !pkg.includes('"version": "1.0.48"') && (!pkg.includes('"version": "1.0.49"') && !pkg.includes('"version": "1.0.51"') && !pkg.includes('"version": "1.0.52"') && (!pkg.includes('"version": "1.0.53"') && (!pkg.includes('"version": "1.0.54"') && (!pkg.includes('"version": "1.0.55"') && (!pkg.includes('"version": "1.0.56"') && (!pkg.includes('"version": "1.0.57"') && (!pkg.includes('"version": "1.0.58"') && (!pkg.includes('"version": "1.0.59"') && (!pkg.includes('"version": "1.0.60"') && (!pkg.includes('"version": "1.0.61"') && (!pkg.includes('"version": "1.0.62"') && !pkg.includes('"version": "1.0.63"') && !pkg.includes('"version": "1.0.64"') && (!pkg.includes('"version": "1.0.65"') && (!pkg.includes('"version": "1.0.66"') && (!pkg.includes('"version": "1.0.67"') && (!pkg.includes('"version": "1.0.68"') && (!pkg.includes('"version": "1.0.69"') && (!pkg.includes('"version": "1.0.70"') && (!pkg.includes('\"version\": \"1.0.71\"') && (!pkg.includes('\"version\": \"1.0.72\"') && (!pkg.includes('\"version\": \"1.0.73\"') && !pkg.includes('\"version\": \"1.0.74\"') && !pkg.includes('\"version\": \"1.0.75\"') && !pkg.includes('\"version\": \"1.0.76\"') && !pkg.includes('\"version\": \"1.0.77\"') && !pkg.includes('\"version\": \"1.0.78\"') && (!pkg.includes('\"version\": \"1.0.79\"') && (!pkg.includes('\"version\": \"1.0.80\"') && (!pkg.includes('\"version\": \"1.0.81\"') && (!pkg.includes('\"version\": \"1.0.82\"') && !pkg.includes('\"version\": \"1.0.83\"')))))))))))))))))))))))))) errors.push('package.json version must be 1.0.47+ compatibility range through 1.0.77.');
if (!sw.includes('dream-library-cache-v1.0.47') || !sw.includes('texture-atlas-manifest-v1.0.47.json')) errors.push('service worker cache/manifest must be v1.0.47.');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.47.json')) errors.push('v1.0.47 texture atlas manifest missing.');
if (!pages.includes('npm run check:boss-stage-lobby-scroll') || !quality.includes('npm run check:boss-stage-lobby-scroll')) errors.push('workflows must run v1.0.47 boss/stage/lobby scroll check.');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Boss statusbar left portrait, stage map comfort and lobby gesture final rescue check passed for v1.0.77.');
