import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const pkg = readFileSync('package.json', 'utf8');
const pages = readFileSync('.github/workflows/github-pages.yml', 'utf8');
const quality = readFileSync('.github/workflows/quality-check.yml', 'utf8');
const errors = [];
const runtime = `${html}\n${main}\n${css}`;

for (const token of [
  '<header class="topbar',
  'class="topbar-spacer"',
  'class="top-actions"',
  'data-camera-action="fit"',
  'data-camera-action="center"',
  'data-camera-action="zoom-in"',
  'data-camera-action="zoom-out"',
  '보기 맞춤',
  '드래그 이동'
]) {
  if (runtime.includes(token)) errors.push(`Removed visible UI token still present: ${token}`);
}
for (const token of [
  'retired-shell-actions hidden',
  'data-visible-controls="removed"',
  'id="exit-options-button"',
  'openOptionsFromExitSheet',
  'data-camera-ui',
  'space-reclaimed',
  '.exit-card-toolbar',
  '.exit-options-button'
]) {
  if (!runtime.includes(token)) errors.push(`Missing v1.0.37 space reclaim/back options token: ${token}`);
}
if (!pkg.includes('"version": "1.0.37"')) errors.push('package.json version must be 1.0.37.');
if (!pkg.includes('check:space-reclaim-back-options')) errors.push('package.json must expose check:space-reclaim-back-options.');
if (!pages.includes('npm run check:space-reclaim-back-options')) errors.push('github-pages workflow must run space reclaim/back options check.');
if (!quality.includes('npm run check:space-reclaim-back-options')) errors.push('quality workflow must run space reclaim/back options check.');
if (/Display Assist|Frame Lock|Kakao Browser|Virtual Frame|Portrait Lock|카카오 브라우저 대응/.test(runtime)) {
  errors.push('Developer/browser diagnostic copy must not be visible in the game UI.');
}

if (errors.length) {
  console.error(`Space reclaim/back options check failed: ${errors.join('; ')}.`);
  process.exit(1);
}
console.log('Space reclaim/back options check passed: top option line and visible camera controls are removed, gear moved to back sheet.');
