import { readFileSync } from 'node:fs';

const guard = readFileSync('src/platform/browserGuard.js', 'utf8');
const index = readFileSync('index.html', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const required = ['blocked: false', 'requestPortraitFullscreen', 'viewport-frame', 'virtual-portrait'];
const combined = `${guard}\n${index}\n${main}\n${css}`;
const missing = required.filter((token) => !combined.includes(token));
if (missing.length) {
  console.error(`In-app policy check failed. Missing: ${missing.join(', ')}`);
  process.exit(1);
}
if (/intent:\/\/|makeChromeIntentUrl|open-external-button|copy-url-button|외부 브라우저|Chrome\/Safari|Chrome으로|Safari/.test(combined)) {
  console.error('External-browser handoff tokens are forbidden. The game must stay in-app.');
  process.exit(1);
}
if (/카카오|Kakao In-App Play|세로 전체화면|전체화면 고정|세로 잠금/.test(index + main)) {
  console.error('Visible in-game copy must not mention Kakao or fullscreen/portrait helper wording.');
  process.exit(1);
}
console.log('In-app quiet layout policy passed. No external handoff or visible helper copy remains.');
