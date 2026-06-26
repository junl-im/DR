import { readFileSync } from 'node:fs';

const guard = readFileSync('src/platform/browserGuard.js', 'utf8');
const index = readFileSync('index.html', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const required = ['kakao-fullscreen-button', 'continue-inapp-button', 'Kakao In-App Play', 'blocked: false', 'requestPortraitFullscreen'];
const missing = required.filter((token) => !guard.includes(token) && !index.includes(token) && !main.includes(token));
if (missing.length) {
  console.error(`Kakao in-app check failed. Missing: ${missing.join(', ')}`);
  process.exit(1);
}
if (/intent:\/\/|makeChromeIntentUrl|open-external-button|copy-url-button|외부 브라우저|Chrome\/Safari|Chrome으로|Safari/.test(guard + index + main)) {
  console.error('Kakao must stay in-app for v1.0.17. Remove external-browser handoff copy and intent URLs.');
  process.exit(1);
}
if (/실행하지 않습니다|차단|경고/.test(index)) {
  console.error('Kakao copy should not use warning/blocking language.');
  process.exit(1);
}
console.log('Kakao in-app portrait policy passed. No external browser handoff remains.');
