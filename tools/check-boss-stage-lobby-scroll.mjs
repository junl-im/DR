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
for (const token of ['data-boss-layout="statusbar-chip-right-v1045"', 'statusbar-chip-v1045', 'v1045-readable-chip']) {
  if (!html.includes(token) && !css.includes(token) && !main.includes(token)) errors.push(`Missing boss statusbar chip-right token: ${token}`);
}
for (const token of ['beginner', 'skilled', 'nightmare', '초보', '숙련', '악몽']) {
  if (!difficulty.includes(token) && !stages.includes(token)) errors.push(`Missing expanded difficulty token: ${token}`);
}
const stageCount = (stages.match(/stage\('/g) || []).length;
if (stageCount < 24) errors.push(`Expected at least 24 campaign stages, found ${stageCount}.`);
const chapterCount = (stages.match(/id: 'chapter-/g) || []).length;
if (chapterCount < 5) errors.push(`Expected at least 5 chapters, found ${chapterCount}.`);
for (const token of ['dy > 2', 'dx * 0.42', 'shell.scrollTop -= deltaY * 1.08', 'is-lobby-dragging', 'v1045-deep-drag-rescue']) {
  if (!main.includes(token)) errors.push(`Missing lobby drag rescue token: ${token}`);
}
for (const token of ['touch-action: pan-y', 'grid-auto-flow: column', 'statusbar-chip-right-v1045']) {
  if (!css.includes(token)) errors.push(`Missing lobby/boss CSS token: ${token}`);
}
for (const banned of ['보기 맞춤', '중앙으로', 'board-radar', 'minimap']) {
  if (html.includes(banned) || main.includes(banned)) errors.push(`Removed UI token reintroduced: ${banned}`);
}
if (!pkg.includes('"version": "1.0.45"')) errors.push('package.json version must be 1.0.45.');
if (!sw.includes('dream-library-cache-v1.0.45') || !sw.includes('texture-atlas-manifest-v1.0.45.json')) errors.push('service worker cache/manifest must be v1.0.45.');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.45.json')) errors.push('v1.0.45 texture atlas manifest missing.');
if (!pages.includes('npm run check:boss-stage-lobby-scroll') || !quality.includes('npm run check:boss-stage-lobby-scroll')) errors.push('workflows must run v1.0.45 boss/stage/lobby scroll check.');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Boss statusbar chip-right, expanded stage ladder and lobby deep drag rescue check passed for v1.0.45.');
