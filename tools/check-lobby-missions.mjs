import { readFileSync } from 'node:fs';

const main = readFileSync('src/main.ts', 'utf8');
const html = readFileSync('index.html', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const packageJson = readFileSync('package.json', 'utf8');

const required = [
  ['index.html', html, 'lobby-mission-deck'],
  ['index.html', html, 'data-lobby-panel="mission"'],
  ['index.html', html, 'data-collapse-target="restoration"'],
  ['src/main.ts', main, 'renderLobbyMissionDeck'],
  ['src/main.ts', main, 'handleLobbyMissionClick'],
  ['src/main.ts', main, 'toggleLobbyPanel'],
  ['src/main.ts', main, "import('./audio/DreamAudio')"],
  ['src/main.ts', main, "import('./engine/SpineBridge')"],
  ['src/styles.css', css, '.mission-deck-panel'],
  ['src/styles.css', css, '.mission-card'],
  ['src/styles.css', css, '.mission-card[data-ready="true"]'],
  ['package.json', packageJson, 'check:lobby-missions']
];
const missing = required.filter(([, text, token]) => !text.includes(token)).map(([file,,token]) => `${file}: ${token}`);
if (/import\s+\{\s*DreamAudio\s*\}\s+from/.test(main)) missing.push('src/main.ts: DreamAudio must stay dynamically imported');
if (/import\s+\{\s*prepareSpineRuntime\s*\}\s+from/.test(main)) missing.push('src/main.ts: Spine runtime must stay dynamically imported');
if (missing.length) {
  console.error(`Lobby mission deck check failed. Missing or invalid:\n${missing.join('\n')}`);
  process.exit(1);
}
console.log('Lobby mission deck and dynamic loading policy passed.');
