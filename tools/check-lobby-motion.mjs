import { readFileSync } from 'node:fs';

const main = readFileSync('src/main.ts', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const checks = [
  [main.includes('syncLobbyMotion'), 'syncLobbyMotion helper missing'],
  [main.includes('document.body.dataset.lobbyMood'), 'lobby mood dataset missing'],
  [main.includes('mascot-companions-v2') && main.includes('mascot-scholar-v2'), 'lobby mascot mood asset switching missing'],
  [css.includes('body[data-lobby-mood="active"]') && css.includes('@keyframes mascotNod'), 'active lobby mascot motion missing'],
  [css.includes('body[data-lobby-mood="radiant"]') && css.includes('@keyframes mascotRadiant'), 'radiant lobby mascot motion missing'],
  [html.includes('mascot-companions-v2.png'), 'lobby hero mascot hook missing']
];
const failed = checks.filter(([ok]) => !ok).map(([, msg]) => msg);
if (failed.length) {
  console.error(failed.join('\n'));
  process.exit(1);
}
console.log('Lobby motion policy passed for v1.0.22.');
