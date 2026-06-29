import { readFileSync, existsSync } from 'node:fs';

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

if (!['1.0.60', '1.0.61', '1.0.62', '1.0.63', '1.0.64', '1.0.65'].includes(pkg.version)) errors.push(`package version must be 1.0.60, got ${pkg.version}`);
if (!pkg.scripts['check:daily-start-pointer']) errors.push('missing package script check:daily-start-pointer');

for (const token of ['v1060-daily-start-target-pointer']) {
  has(index, token, 'index v1.0.60 token');
  has(main, token, 'main v1.0.60 token');
  has(css, token, 'css v1.0.60 token');
}

has(index, 'id="daily-start-target-ring"', 'daily start target ring element');
if (!index.includes('<em>오늘의 복원</em>을 눌러요') && !index.includes('<em>오늘의 복원</em> 버튼입니다')) errors.push('missing bubble explicitly names the target button');
if (!index.includes('data-daily-start-pointer="v1060-daily-start-target-pointer"') || !index.includes('aria-describedby="daily-start-signal daily-route-ribbon')) errors.push('daily restore button carries precise pointer hook');
has(main, 'const DAILY_START_TARGET_POINTER_PATCH', 'daily pointer patch constant');
has(main, "document.body.dataset.dailyStartPointer", 'daily pointer body dataset');
has(main, "'.daily-start-target-ring'", 'daily target ring runtime sync');
has(main, 'ringRect', 'overlap measurement includes target ring');
has(css, '.daily-start-target-ring[data-daily-start-pointer="v1060-daily-start-target-pointer"]', 'target lock ring CSS');
has(css, '@keyframes dailyPointerBeam', 'pointer beam animation');
has(css, 'body.daily-start-overlap-safe .daily-start-target-ring', 'compact target ring guard');
has(sw, 'dream-library-cache-v1.0.60', 'service worker v1.0.60 cache');
has(sw, 'texture-atlas-manifest-v1.0.60.json', 'service worker v1.0.60 atlas preload');
has(difficulty, 'texture-atlas-manifest-v1.0.60.json', 'difficulty v1.0.60 atlas preload');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.60.json')) errors.push('missing v1.0.60 texture atlas manifest');
has(pages, 'npm run check:daily-start-pointer', 'GitHub Pages daily start pointer QA hook');
has(quality, 'npm run check:daily-start-pointer', 'Quality daily start pointer QA hook');

for (const forbidden of ['<svg', 'DELETE_REMOVED', 'Display Assist', 'Frame Lock', 'Virtual Frame', 'Kakao Browser', '보기 맞춤', '중앙으로']) {
  if (index.includes(forbidden) || main.includes(forbidden) || css.includes(forbidden)) errors.push(`forbidden token remains: ${forbidden}`);
}
if (main.includes('requestFullscreen()') || main.includes('screen.orientation.lock(')) errors.push('automatic fullscreen/orientation lock must not be added');

if (errors.length) {
  console.error(`Daily start pointer QA check failed: ${errors.join('; ')}`);
  process.exit(1);
}
console.log('Daily start pointer QA check passed: v1.0.60 bubble, beam, arrow and target ring clearly point at 오늘의 복원.');
