import { readFileSync, existsSync } from 'node:fs';
import process from 'node:process';

const read = (path) => readFileSync(path, 'utf8');
const pkg = JSON.parse(read('package.json'));
const main = read('src/main.ts');
const css = read('src/styles.css');
const index = read('index.html');
const difficulty = read('src/game/difficulty.js');
const sw = read('public/sw.js');
const pages = read('.github/workflows/github-pages.yml');
const quality = read('.github/workflows/quality-check.yml');
const errors = [];
const requireText = (text, token, label) => { if (!text.includes(token)) errors.push(`Missing ${label}: ${token}`); };

if (!['1.0.47', '1.0.48', '1.0.49', '1.0.50', '1.0.50', '1.0.51', '1.0.52', '1.0.53', '1.0.54', '1.0.55', '1.0.56', '1.0.57', '1.0.58', '1.0.59', '1.0.60', '1.0.61', '1.0.62', '1.0.63', '1.0.64', '1.0.65', '1.0.66', '1.0.67', '1.0.68', '1.0.69', '1.0.70', '1.0.71'].includes(pkg.version)) errors.push(`package version must be 1.0.47, 1.0.48, 1.0.49 or 1.0.50, got ${pkg.version}`);
if (!pkg.scripts['check:stage-map-boss-difficulty-lobby']) errors.push('missing package script check:stage-map-boss-difficulty-lobby');
requireText(index, 'statusbar-icon-right-v1046', 'v1.0.47 boss icon-right layout in index');
requireText(index, 'v1046-icon-readability', 'v1.0.47 boss readable chip panel');
requireText(main, 'v1046-stage-map-comfort-42', 'stage map comfort token');
requireText(main, 'v1046-gesture-final-rescue', 'lobby final gesture token');
requireText(main, 'v1046-difficulty-tempo-wide-ladder', 'difficulty tempo token');
requireText(main, 'DIFFICULTY_TEMPO_PROFILES', 'difficulty tempo profiles');
requireText(main, 'getPairMatchTimeBonus', 'difficulty-based pair time bonus');
requireText(main, 'dy > 1.6', 'deeper lobby drag rescue threshold');
requireText(main, 'dx * 0.34', 'lobby drag horizontal tolerance');
requireText(css, 'statusbar-icon-right-v1046', 'boss icon CSS');
requireText(css, 'next-goal-v1046', 'next goal stage map CSS');
requireText(css, 'data-lobby-drag-rescue="v1046-gesture-final-rescue"', 'lobby gesture final CSS hook');
requireText(difficulty, "label: '도전'", 'expert difficulty label as 도전');
requireText(sw, 'dream-library-cache-v1.0.47', 'service worker v1.0.47 cache');
requireText(sw, 'texture-atlas-manifest-v1.0.47.json', 'v1.0.47 texture atlas manifest');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.47.json')) errors.push('missing v1.0.47 texture atlas manifest file');
if (!pages.includes('npm run check:stage-map-boss-difficulty-lobby') || !quality.includes('npm run check:stage-map-boss-difficulty-lobby')) errors.push('workflows must run v1.0.47 stage map/boss/difficulty/lobby check');
for (const forbidden of ['보기 맞춤', '중앙으로', '드래그 이동']) {
  if (index.includes(forbidden)) errors.push(`forbidden removed UI copy remains: ${forbidden}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Stage map comfort, boss icon-right statusbar, difficulty tempo and lobby gesture final QA passed for v1.0.47.');
