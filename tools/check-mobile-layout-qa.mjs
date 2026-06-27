import { readFileSync } from 'node:fs';

const css = readFileSync('src/styles.css', 'utf8');
const viewport = readFileSync('src/platform/viewportFrame.js', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const required = [
  [viewport.includes('source-landscape') && viewport.includes('lastPortraitFrame'), 'viewport frame must preserve portrait frame during source landscape'],
  [css.includes('html.source-landscape .app-shell') && css.includes('max-width: min(var(--app-width)'), 'source landscape shell fit rule missing'],
  [css.includes('body[data-screen="game"] .pixi-board-host') && css.includes('min(64vh, 430px)'), 'compact board height rule missing'],
  [css.includes('body[data-screen="game"] .game-hud') && css.includes('body[data-screen="game"] .boss-lane'), 'compact HUD/boss lane rules missing'],
  [main.includes('requestKakaoPortraitLock') && main.includes('initLobbyScrollGuard'), 'mobile runtime guard hooks missing']
];
const failed = required.filter(([ok]) => !ok).map(([, message]) => message);
if (failed.length) {
  console.error(`Mobile layout QA failed: ${failed.join('; ')}`);
  process.exit(1);
}
console.log('Mobile layout QA policy passed for v1.0.23.');
