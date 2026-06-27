import { readFileSync, existsSync } from 'node:fs';
const read = (path) => readFileSync(path, 'utf8');
const pkg = JSON.parse(read('package.json'));
const stages = read('src/game/stages.js');
const main = read('src/main.ts');
const renderer = read('src/rendering/DreamPixiRenderer.ts');
const index = read('index.html');
const css = read('src/styles.css');
const sw = read('public/sw.js');
const pages = read('.github/workflows/github-pages.yml');
const quality = read('.github/workflows/quality-check.yml');
const errors = [];
const has = (text, token, label) => { if (!text.includes(token)) errors.push(`Missing ${label}: ${token}`); };
if (pkg.version !== '1.0.49') errors.push(`package version must be 1.0.49, got ${pkg.version}`);
if (!pkg.scripts['check:summer-event-vfx-pass']) errors.push('missing package script check:summer-event-vfx-pass');
has(stages, 'passMissionLabels', 'season pass mission labels');
has(stages, 'vfxModifiers', 'summer VFX modifier export');
has(main, 'v1049-summer-event-vfx', 'summer event VFX token');
has(main, 'v1049-summer-pass-missions', 'summer pass missions token');
has(main, 'getSummerPassMissionCards', 'season pass mission cards');
has(main, 'getSummerModifierVfxLabels', 'modifier VFX labels');
has(main, 'renderer.playSummerModifierVfx', 'modifier VFX bridge');
has(main, 'renderer.playSeasonPassRewardBurst', 'season pass reward burst bridge');
has(main, 'v1049-compact-chapter-carousel', 'compact chapter carousel token');
has(main, 'v1049-boss-season-polish', 'boss season polish token');
has(renderer, 'playSummerModifierVfx', 'renderer summer modifier VFX');
has(renderer, 'playSeasonPassRewardBurst', 'renderer pass reward burst');
has(renderer, 'summer-event-vfx', 'VFX graphics label');
has(index, 'data-season-vfx="v1049-summer-event-vfx"', 'season VFX lobby mount');
has(index, 'data-season-pass="v1049-summer-pass-missions"', 'pass missions lobby mount');
has(css, 'season-pass-missions', 'pass missions CSS');
has(css, 'v1049-season-vfx-gesture-qa', 'season gesture QA CSS');
has(css, 'v1049-compact-chapter-carousel', 'compact carousel CSS');
has(css, 'v1049-boss-season-polish', 'boss season polish CSS');
has(sw, 'dream-library-cache-v1.0.49', 'service worker v1.0.49 cache');
has(sw, 'texture-atlas-manifest-v1.0.49.json', 'v1.0.49 atlas manifest preload');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.49.json')) errors.push('missing v1.0.49 texture atlas manifest');
if (!pages.includes('npm run check:summer-event-vfx-pass') || !quality.includes('npm run check:summer-event-vfx-pass')) errors.push('workflows must run check:summer-event-vfx-pass');
for (const forbidden of ['보기 맞춤', '중앙으로', '드래그 이동 도움말', 'minimap', 'board radar']) {
  if (index.includes(forbidden)) errors.push(`forbidden removed UI copy remains: ${forbidden}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Summer event VFX/pass check passed: modifier VFX, pass missions, compact carousel and boss season polish are active.');
