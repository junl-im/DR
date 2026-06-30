import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const audio = readFileSync('src/audio/DreamAudio.ts', 'utf8');
const pkg = readFileSync('package.json', 'utf8');
const sw = readFileSync('public/sw.js', 'utf8');
const pages = readFileSync('.github/workflows/github-pages.yml', 'utf8');
const quality = readFileSync('.github/workflows/quality-check.yml', 'utf8');
const runtime = `${html}
${main}
${css}
${audio}`;
const errors = [];
for (const token of [
  'ACCOUNT_TIME_PRESSURE_PATCH',
  'v1042-account-time-pressure',
  'PAIR_MATCH_TIME_BONUS_SECONDS = 3',
  'grantPairMatchTimeBonus',
  'triggerStallPressure',
  'STALL_PRESSURE_FIRST_SECONDS',
  'settings-guest-button',
  'settings-google-button',
  'settings-email-button',
  'switchToGuestAccountFromOptions',
  'switchToGoogleAccountFromOptions',
  'openEmailAccountSwitchFromOptions',
  'boss-role-badge',
  '보스 상태: HP·압박·반격',
  'urgent',
  'warning'
]) {
  if (!runtime.includes(token)) errors.push(`Missing v1.0.47 account/time pressure token: ${token}`);
}
if (!/grantPairMatchTimeBonus\(firstTile, secondTile\)/.test(main)) errors.push('Successful pair match must grant the +3 second bonus.');
if (!/state\.noMatchSeconds \+= 1/.test(main) || !/triggerStallPressure\(\)/.test(main)) errors.push('Timer must track no-match delay and trigger stall pressure.');
if (!html.includes('data-match-bonus="plus-3"')) errors.push('Time HUD must expose the +3s match bonus hook.');
if (!audio.includes("'urgent'") || !audio.includes("'warning'")) errors.push('DreamAudio must expose urgent/warning cues.');
if (!pkg.includes('"version": "1.0.47"') && !pkg.includes('"version": "1.0.48"') && (!pkg.includes('"version": "1.0.49"') && !pkg.includes('"version": "1.0.51"') && !pkg.includes('"version": "1.0.52"') && (!pkg.includes('"version": "1.0.53"') && (!pkg.includes('"version": "1.0.54"') && (!pkg.includes('"version": "1.0.55"') && (!pkg.includes('"version": "1.0.56"') && (!pkg.includes('"version": "1.0.57"') && (!pkg.includes('"version": "1.0.58"') && (!pkg.includes('"version": "1.0.59"') && (!pkg.includes('"version": "1.0.60"') && (!pkg.includes('"version": "1.0.61"') && (!pkg.includes('"version": "1.0.62"') && !pkg.includes('"version": "1.0.63"') && !pkg.includes('"version": "1.0.64"') && (!pkg.includes('"version": "1.0.65"') && (!pkg.includes('"version": "1.0.66"') && (!pkg.includes('"version": "1.0.67"') && (!pkg.includes('"version": "1.0.68"') && (!pkg.includes('"version": "1.0.69"') && (!pkg.includes('"version": "1.0.70"') && (!pkg.includes('\"version\": \"1.0.71\"') && !pkg.includes('\"version\": \"1.0.72\"')))))))))))))))))))) errors.push('package.json version must be 1.0.47, 1.0.48, 1.0.49 or 1.0.50.');
if (!pkg.includes('check:account-time-pressure')) errors.push('package.json must expose check:account-time-pressure.');
if (!sw.includes('dream-library-cache-v1.0.47') || !sw.includes('texture-atlas-manifest-v1.0.47.json')) errors.push('service worker cache/manifest must be v1.0.47.');
if (!sw.includes('v1042-cache-slim-account-time-pressure')) errors.push('service worker cache slim policy must be v1042 account/time pressure.');
if (!pages.includes('npm run check:account-time-pressure')) errors.push('github-pages workflow must run v1.0.47 account/time pressure check.');
if (!quality.includes('npm run check:account-time-pressure')) errors.push('quality workflow must run v1.0.47 account/time pressure check.');
for (const banned of ['미니맵', '>보기<', '>중앙<', '>+<', '드래그 이동 도움말']) {
  if (html.includes(banned)) errors.push(`Removed UI/copy should not return in HTML: ${banned}`);
}
if (errors.length) {
  console.error(`Account/time pressure check failed: ${errors.join('; ')}`);
  process.exit(1);
}
console.log('Account/time pressure check passed: options account switch, +3s pair bonus, stall urgency and boss role label are active.');
