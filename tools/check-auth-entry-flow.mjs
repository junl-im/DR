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
if (!pkg.includes('"version": "1.0.84"') && !pkg.includes('"version": "1.0.47"') && !pkg.includes('"version": "1.0.48"') && (!pkg.includes('"version": "1.0.49"') && !pkg.includes('"version": "1.0.51"') && !pkg.includes('"version": "1.0.52"') && (!pkg.includes('"version": "1.0.53"') && (!pkg.includes('"version": "1.0.54"') && (!pkg.includes('"version": "1.0.55"') && (!pkg.includes('"version": "1.0.56"') && (!pkg.includes('"version": "1.0.57"') && (!pkg.includes('"version": "1.0.58"') && (!pkg.includes('"version": "1.0.59"') && (!pkg.includes('"version": "1.0.60"') && (!pkg.includes('"version": "1.0.61"') && (!pkg.includes('"version": "1.0.62"') && !pkg.includes('"version": "1.0.63"') && !pkg.includes('"version": "1.0.64"') && (!pkg.includes('"version": "1.0.65"') && (!pkg.includes('"version": "1.0.66"') && (!pkg.includes('"version": "1.0.67"') && (!pkg.includes('"version": "1.0.68"') && (!pkg.includes('"version": "1.0.69"') && (!pkg.includes('"version": "1.0.70"') && (!pkg.includes('\"version\": \"1.0.71\"') && (!pkg.includes('\"version\": \"1.0.72\"') && (!pkg.includes('\"version\": \"1.0.73\"') && !pkg.includes('\"version\": \"1.0.74\"') && !pkg.includes('\"version\": \"1.0.75\"') && !pkg.includes('\"version\": \"1.0.76\"') && !pkg.includes('\"version\": \"1.0.77\"') && !pkg.includes('\"version\": \"1.0.78\"') && (!pkg.includes('\"version\": \"1.0.79\"') && (!pkg.includes('\"version\": \"1.0.80\"') && (!pkg.includes('\"version\": \"1.0.81\"') && (!pkg.includes('\"version\": \"1.0.82\"') && !pkg.includes('\"version\": \"1.0.83\"')))))))))))))))))))))))))) errors.push('package.json version must be 1.0.47+ compatibility range through 1.0.77.');
if (!pkg.includes('check:auth-entry-flow')) errors.push('package.json must expose check:auth-entry-flow.');
if (!sw.includes('dream-library-cache-v1.0.47') || !sw.includes('texture-atlas-manifest-v1.0.47.json')) errors.push('service worker cache/manifest must be v1.0.47.');
if (!pages.includes('npm run check:auth-entry-flow')) errors.push('github-pages workflow must run auth entry flow check.');
if (!quality.includes('npm run check:auth-entry-flow')) errors.push('quality workflow must run auth entry flow check.');

if (errors.length) {
  console.error(`Auth entry flow check failed: ${errors.join('; ')}`);
  process.exit(1);
}
console.log('Auth entry flow check passed: first screen is guest/google/email login and direct lobby shortcut is retired.');
