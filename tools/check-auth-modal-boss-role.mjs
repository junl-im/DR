import { readFileSync, existsSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const auth = readFileSync('src/auth.js', 'utf8');
const pkg = readFileSync('package.json', 'utf8');
const sw = readFileSync('public/sw.js', 'utf8');
const pages = readFileSync('.github/workflows/github-pages.yml', 'utf8');
const quality = readFileSync('.github/workflows/quality-check.yml', 'utf8');
const runtime = `${html}\n${main}\n${css}\n${auth}`;
const errors = [];

for (const token of [
  'AUTH_MODAL_BOSS_ROLE_PATCH',
  'v1043-auth-modal-boss-role',
  'center-popup-v1043',
  'email-auth-modal',
  'email-modal-input',
  'password-modal-input',
  'openEmailAuthModal',
  'runEmailLoginFromModal',
  'runEmailSignupFromModal',
  'retired-inline-email-form'
]) {
  if (!runtime.includes(token)) errors.push(`Missing centered email auth token: ${token}`);
}
for (const token of [
  'signInWithRedirect',
  'getRedirectResult',
  'completeGoogleRedirect',
  'GOOGLE_REDIRECT_PENDING_KEY',
  'auth/redirect-started',
  '구글 로그인 창을 여는 중입니다'
]) {
  if (!runtime.includes(token)) errors.push(`Missing Google fallback token: ${token}`);
}
for (const token of [
  'v1043-account-switch-modal',
  'settings-google-button',
  'settings-email-button',
  '구글 로그인',
  '이메일 로그인'
]) {
  if (!runtime.includes(token)) errors.push(`Missing option account switch token: ${token}`);
}
for (const token of [
  'clear-status-v1043',
  'boss-role-stack',
  'boss-state-icon',
  'boss-role-help',
  '보스 상태',
  'HP',
  '시간 압박',
  '실수 반격',
  'getBossReadableRole',
  'showBossRolePulseOnce'
]) {
  if (!runtime.includes(token)) errors.push(`Missing readable boss role token: ${token}`);
}
if (/class="email-form(?![^>]*retired-inline-email-form)/.test(html)) errors.push('Inline email form must remain retired so email login opens in the centered modal.');
for (const banned of ['미니맵', '>보기<', '>중앙<', '>+<', '드래그 이동 도움말']) {
  if (html.includes(banned)) errors.push(`Removed UI/copy should not return in HTML: ${banned}`);
}
if (!pkg.includes('"version": "1.0.47"') && !pkg.includes('"version": "1.0.48"') && (!pkg.includes('"version": "1.0.49"') && !pkg.includes('"version": "1.0.51"') && !pkg.includes('"version": "1.0.52"') && (!pkg.includes('"version": "1.0.53"') && (!pkg.includes('"version": "1.0.54"') && (!pkg.includes('"version": "1.0.55"') && (!pkg.includes('"version": "1.0.56"') && (!pkg.includes('"version": "1.0.57"') && (!pkg.includes('"version": "1.0.58"') && (!pkg.includes('"version": "1.0.59"') && (!pkg.includes('"version": "1.0.60"') && (!pkg.includes('"version": "1.0.61"') && (!pkg.includes('"version": "1.0.62"') && !pkg.includes('"version": "1.0.63"'))))))))))))) errors.push('package.json version must be 1.0.47, 1.0.48, 1.0.49 or 1.0.50.');
if (!pkg.includes('check:auth-modal-boss-role')) errors.push('package.json must expose check:auth-modal-boss-role.');
if (!sw.includes('dream-library-cache-v1.0.47') || !sw.includes('texture-atlas-manifest-v1.0.47.json')) errors.push('service worker cache/manifest must be v1.0.47.');
if (!sw.includes('v1043-cache-slim-auth-modal-boss-role')) errors.push('service worker cache slim policy must be v1043 auth modal boss role.');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.47.json')) errors.push('v1.0.47 texture atlas manifest file missing.');
if (!pages.includes('npm run check:auth-modal-boss-role')) errors.push('github-pages workflow must run auth modal boss role check.');
if (!quality.includes('npm run check:auth-modal-boss-role')) errors.push('quality workflow must run auth modal boss role check.');

if (errors.length) {
  console.error(`Auth modal boss role check failed: ${errors.join('; ')}`);
  process.exit(1);
}
console.log('Auth modal boss role check passed: Google fallback, centered email login and readable boss status v1.0.47 are active.');
