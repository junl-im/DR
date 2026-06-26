import { readFileSync } from 'node:fs';

const guard = readFileSync('src/platform/browserGuard.js', 'utf8');
const index = readFileSync('index.html', 'utf8');
const required = ['makeChromeIntentUrl', 'continue-inapp-button', 'Browser Handoff', 'blocked: false'];
const missing = required.filter((token) => !guard.includes(token) && !index.includes(token));
if (missing.length) {
  console.error(`Kakao handoff check failed. Missing: ${missing.join(', ')}`);
  process.exit(1);
}
if (/실행하지 않습니다|차단|경고/.test(index)) {
  console.error('Kakao handoff copy should not use warning/blocking language.');
  process.exit(1);
}
console.log('Kakao handoff policy passed.');
