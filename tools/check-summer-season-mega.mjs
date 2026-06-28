import { readFileSync, existsSync } from 'node:fs';
import process from 'node:process';
const read = (path) => readFileSync(path, 'utf8');
const pkg = JSON.parse(read('package.json'));
const stages = read('src/game/stages.js');
const main = read('src/main.ts');
const index = read('index.html');
const css = read('src/styles.css');
const sw = read('public/sw.js');
const pages = read('.github/workflows/github-pages.yml');
const quality = read('.github/workflows/quality-check.yml');
const errors = [];
const requireText = (text, token, label) => { if (!text.includes(token)) errors.push(`Missing ${label}: ${token}`); };
if (!['1.0.47', '1.0.48', '1.0.49', '1.0.50', '1.0.50', '1.0.51', '1.0.52', '1.0.53', '1.0.54', '1.0.55', '1.0.56', '1.0.57', '1.0.58', '1.0.59'].includes(pkg.version)) errors.push(`package version must be 1.0.47, 1.0.48, 1.0.49 or 1.0.50, got ${pkg.version}`);
if (!pkg.scripts['check:summer-season-mega']) errors.push('missing package script check:summer-season-mega');
const stageMatches = [...stages.matchAll(/stage\('/g)].length;
if (stageMatches < 78) errors.push(`expected at least 78 stages after mega summer update, got ${stageMatches}`);
requireText(stages, 'SUMMER_SEASON_EVENT', 'summer season event export');
if (!stages.includes('chapter-13') && !stages.includes('chapter-15')) errors.push('Missing 13+ chapter campaign');
requireText(stages, "stage('c13-06'", 'summer finale stage c13-06');
requireText(stages, 'summer-2026', 'summer season stage marker');
requireText(stages, 'sunTide', 'summer modifier sun tide');
requireText(index, 'summer-season-panel', 'summer season lobby panel');
if (!index.includes('summer-season-panel')) errors.push('Missing summer season progress panel');
if (!main.includes('v1049-summer-event-vfx') && !main.includes('v1050-summer-finale-event-vfx') && !main.includes('v1051-summer-shop-claim-vfx')) errors.push('Missing summer patch token');
requireText(main, 'grantSummerSeasonComboBonus', 'season combo bonus gameplay');
requireText(main, 'getSummerSeasonStages', 'season stage progress helper');
if (!main.includes('v1049-season-vfx-gesture-qa') && !main.includes('v1050-summer-design-gesture-qa') && !main.includes('v1051-mobile-design-gesture-final')) errors.push('Missing season lobby drag token');
requireText(main, 'dy > 1.2', 'lobby drag threshold refinement');
requireText(main, 'dx * 0.28', 'lobby horizontal tolerance refinement');
if (!css.includes('v1049-summer-event-vfx') && !css.includes('v1050-summer-finale-event-vfx') && !css.includes('v1051-summer-shop-claim-vfx')) errors.push('Missing summer CSS token');
if (!css.includes('next-goal-v1048-summer-pass') && !main.includes('next-goal-v1050-summer-finale') && !main.includes('next-goal-v1051-shop-claim')) errors.push('Missing summer stage map CSS token');
if (!sw.includes('dream-library-cache-v1.0.48') && !sw.includes('dream-library-cache-v1.0.49') && !sw.includes('dream-library-cache-v1.0.50') && !sw.includes('dream-library-cache-v1.0.51')) errors.push('Missing service worker v1.0.48/v1.0.49 cache');
if (!sw.includes('texture-atlas-manifest-v1.0.48.json') && !sw.includes('texture-atlas-manifest-v1.0.49.json') && !sw.includes('texture-atlas-manifest-v1.0.50.json') && !sw.includes('texture-atlas-manifest-v1.0.51.json')) errors.push('Missing v1.0.48/v1.0.49 atlas manifest');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.48.json') && !existsSync('public/assets/meta/texture-atlas-manifest-v1.0.49.json') && !existsSync('public/assets/meta/texture-atlas-manifest-v1.0.50.json') && !existsSync('public/assets/meta/texture-atlas-manifest-v1.0.51.json')) errors.push('missing v1.0.48/v1.0.49 texture atlas manifest');
if (!pages.includes('npm run check:summer-season-mega') || !quality.includes('npm run check:summer-season-mega')) errors.push('workflows must run check:summer-season-mega');
for (const forbidden of ['보기 맞춤', '중앙으로', '드래그 이동 도움말', 'minimap', 'board radar']) {
  if (index.includes(forbidden)) errors.push(`forbidden removed UI copy remains: ${forbidden}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Mega summer season update check passed: 78 stages, summer panel, combo bonus, cache and lobby gesture QA are active.');
