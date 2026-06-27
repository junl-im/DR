import { readFileSync } from 'node:fs';

const styles = readFileSync('src/styles.css', 'utf8');
const viewport = readFileSync('src/platform/viewportFrame.js', 'utf8');
const portrait = readFileSync('src/platform/portraitLock.js', 'utf8');
const errors = [];

if (!/body\[data-screen="lobby"\] \.app-shell[\s\S]*touch-action:\s*pan-y/.test(styles)) errors.push('Lobby app shell must prioritize vertical pan scrolling.');
if (!/body\[data-screen="lobby"\] \.app-shell[\s\S]*overflow-y:\s*auto/.test(styles)) errors.push('Lobby app shell must keep vertical overflow auto.');
if (!/\.pixi-board-host,\s*\.pixi-board-host canvas[\s\S]*touch-action:\s*none/.test(styles)) errors.push('Board canvas must keep game-only touch-action none.');
if (!styles.includes('--tap-slop')) errors.push('Touch QA variables must include tap slop marker.');
if (!viewport.includes('readStableViewport')) errors.push('Viewport frame must use stable viewport sampling.');
if (!portrait.includes('distance <= TAP_SLOP')) errors.push('Portrait guard must distinguish tap gestures from scroll drags.');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Touch QA policy passed: lobby scroll, board touch isolation and stable viewport sampling are present.');
