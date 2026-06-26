import { readFileSync } from 'node:fs';

const main = readFileSync('src/main.ts', 'utf8');
const index = readFileSync('index.html', 'utf8');
const packageJson = readFileSync('package.json', 'utf8');

const required = ['enterLobbyFromStart', '진짜 게임 시작', '서고 입장', 'check:lobby-flow', 'lobby-mission-deck'];
const missing = required.filter((token) => !main.includes(token) && !index.includes(token) && !packageJson.includes(token));
if (missing.length) {
  console.error(`Lobby flow check failed. Missing: ${missing.join(', ')}`);
  process.exit(1);
}

const authBlock = main.slice(main.indexOf('el.anonymousButton.addEventListener'), main.indexOf('el.signoutButton.addEventListener'));
if (/startSelectedStage\s*\(/.test(authBlock)) {
  console.error('Login/start auth buttons must enter the lobby first, not start a board immediately.');
  process.exit(1);
}
console.log('Lobby-first flow policy passed with mission deck routing.');
