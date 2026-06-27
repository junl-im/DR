import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const pkg = readFileSync('package.json', 'utf8');
const sw = readFileSync('public/sw.js', 'utf8');
const pages = readFileSync('.github/workflows/github-pages.yml', 'utf8');
const quality = readFileSync('.github/workflows/quality-check.yml', 'utf8');
const runtime = `${html}\n${main}\n${css}`;
const errors = [];

for (const token of [
  'AUTH_ENTRY_SIMPLIFICATION_PATCH',
  'v1042-auth-entry-simplified',
  'guest-google-email-v1042',
  'enterLobbyFromAuth',
  '게스트 로그인',
  '구글 로그인',
  '이메일 로그인',
  'retired-direct-lobby-entry'
]) {
  if (!runtime.includes(token)) errors.push(`Missing auth entry simplification token: ${token}`);
}
for (const banned of [
  '>서고 입장<',
  '>Google 저장<',
  '>Email 저장<',
  '>로비 입장<',
  '>로그인 후 로비<',
  '>가입 후 로비<',
  '시작하면 로비로 입장합니다'
]) {
  if (runtime.includes(banned)) errors.push(`Old login/lobby entry copy still visible: ${banned}`);
}
const authBlock = main.slice(main.indexOf('el.anonymousButton.addEventListener'), main.indexOf('el.signoutButton.addEventListener'));
if (/startSelectedStage\s*\(/.test(authBlock)) errors.push('Auth buttons must not start a board directly. They must enter lobby selection first.');
if (!/enterLobbyFromAuth\('guest'\)/.test(authBlock)) errors.push('Guest login must route through enterLobbyFromAuth(guest).');
if (!(/enterLobbyFromAuth\('google'\)/.test(authBlock) || /runGoogleLogin\('start'\)/.test(authBlock))) errors.push('Google login must route through runGoogleLogin(start) or enterLobbyFromAuth(google).');
if (!(/enterLobbyFromAuth\('email'\)/.test(authBlock) || /runEmailLoginFromModal\(\)/.test(authBlock))) errors.push('Email login must route through the centered modal or enterLobbyFromAuth(email).');
if (!pkg.includes('"version": "1.0.45"')) errors.push('package.json version must be 1.0.45.');
if (!pkg.includes('check:auth-entry-flow')) errors.push('package.json must expose check:auth-entry-flow.');
if (!sw.includes('dream-library-cache-v1.0.45') || !sw.includes('texture-atlas-manifest-v1.0.45.json')) errors.push('service worker cache/manifest must be v1.0.45.');
if (!pages.includes('npm run check:auth-entry-flow')) errors.push('github-pages workflow must run auth entry flow check.');
if (!quality.includes('npm run check:auth-entry-flow')) errors.push('quality workflow must run auth entry flow check.');

if (errors.length) {
  console.error(`Auth entry flow check failed: ${errors.join('; ')}`);
  process.exit(1);
}
console.log('Auth entry flow check passed: first screen is guest/google/email login and direct lobby shortcut is retired.');
