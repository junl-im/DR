import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const sw = readFileSync('public/sw.js', 'utf8');
const pwa = readFileSync('src/platform/pwa.js', 'utf8');
const errors = [];

if (!html.includes('id="screen-login" class="screen screen-login active"')) errors.push('Login screen must be the only initially active screen in HTML.');
if (!main.includes('forceLoginBootScreen()')) errors.push('Main runtime must force a clean login boot screen before async restoration.');
if (!main.includes("screenEl.id === 'screen-login'")) errors.push('Boot sanitizer must explicitly keep only screen-login active.');
if (!sw.includes('dream-library-cache-v1.0.31')) errors.push('Service worker cache version must match v1.0.31.');
if (!sw.includes('isNavigation') || !sw.includes('fetch(request).then')) errors.push('Service worker must use network-first navigation/app-code fetches to avoid stale first screens.');
if (!pwa.includes('registration.update()')) errors.push('PWA registration must request service worker update checks on load.');
if (/Display Assist|Frame Lock|Kakao Browser|Virtual Frame|Portrait Lock|카카오 브라우저 대응/.test(html + main)) {
  errors.push('Developer/browser diagnostic copy must not be visible.');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Boot screen stability check passed: startup is forced to the intended first screen and SW avoids stale document cache.');
