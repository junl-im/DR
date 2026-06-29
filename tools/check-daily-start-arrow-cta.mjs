import { existsSync, readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const pkg = JSON.parse(read('package.json'));
const index = read('index.html');
const main = read('src/main.ts');
const css = read('src/styles.css');
const sw = read('public/sw.js');
const difficulty = read('src/game/difficulty.js');
const pages = read('.github/workflows/github-pages.yml');
const quality = read('.github/workflows/quality-check.yml');
const errors = [];
const has = (text, token, label) => { if (!text.includes(token)) errors.push(`missing ${label}: ${token}`); };

if (!['1.0.64', '1.0.65', '1.0.66'].includes(pkg.version)) errors.push(`package version must be 1.0.64, got ${pkg.version}`);
if (!pkg.scripts['check:daily-start-arrow-cta']) errors.push('missing package script check:daily-start-arrow-cta');
for (const token of ['v1064-daily-start-arrow-only-cta', 'v1064-lobby-ui-polish-pass']) {
  has(index, token, 'index v1.0.64 token');
  has(main, token, 'main v1.0.64 token');
  has(css, token, 'css v1.0.64 token');
}
has(index, 'class="signal-arrow"', 'right arrow cue element');
has(index, '<strong>게임 시작</strong>', 'game start CTA title');
has(index, '<em>오늘의 복원</em> 버튼입니다', 'target copy points at daily restore');
if (index.includes('signal-finger') || index.includes('☝') || index.includes('👆')) errors.push('finger cue must be removed from the daily start widget HTML');
has(main, 'const DAILY_START_ARROW_CTA_PATCH', 'arrow CTA patch constant');
has(main, 'document.body.dataset.dailyStartArrowCta', 'arrow CTA body dataset');
has(main, "arrow.textContent = '➜'", 'runtime arrow-only text guard');
has(css, '.daily-start-signal[data-daily-start-arrow-cta="v1064-daily-start-arrow-only-cta"] .signal-arrow', 'arrow-only CTA CSS');
has(css, '@keyframes dailyArrowOnlyNudge', 'arrow-only nudge animation');
has(css, '.daily-start-signal[data-daily-start-arrow-cta="v1064-daily-start-arrow-only-cta"] .signal-finger { display: none !important; }', 'finger safety hide guard');
has(sw, 'dream-library-cache-v1.0.64', 'service worker v1.0.64 cache');
has(sw, 'texture-atlas-manifest-v1.0.64.json', 'service worker v1.0.64 atlas preload');
has(difficulty, 'texture-atlas-manifest-v1.0.64.json', 'difficulty v1.0.64 atlas preload');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.64.json') && !difficulty.includes('texture-atlas-manifest-v1.0.65.json')) errors.push('missing v1.0.64 texture atlas manifest');
has(pages, 'npm run check:daily-start-arrow-cta', 'GitHub Pages v1.0.64 QA hook');
has(quality, 'npm run check:daily-start-arrow-cta', 'Quality v1.0.64 QA hook');
for (const forbidden of ['<svg', 'DELETE_REMOVED', 'Display Assist', 'Frame Lock', 'Virtual Frame', 'Kakao Browser', '보기 맞춤', '중앙으로']) {
  if (index.includes(forbidden) || main.includes(forbidden) || css.includes(forbidden)) errors.push(`forbidden token remains: ${forbidden}`);
}
if (main.includes('requestFullscreen()') || main.includes('screen.orientation.lock(')) errors.push('automatic fullscreen/orientation lock must not be added');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Daily start arrow CTA QA check passed: v1.0.64 removes finger cue and keeps the right-arrow start widget aimed at 오늘의 복원.');
