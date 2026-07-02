import { readFileSync, existsSync } from 'node:fs';

const files = {
  pkg: JSON.parse(readFileSync('package.json', 'utf8')),
  html: readFileSync('index.html', 'utf8'),
  main: readFileSync('src/main.ts', 'utf8'),
  css: readFileSync('src/styles.css', 'utf8'),
  sw: readFileSync('public/sw.js', 'utf8'),
  difficulty: readFileSync('src/game/difficulty.js', 'utf8'),
  pages: existsSync('.github/workflows/github-pages.yml') ? readFileSync('.github/workflows/github-pages.yml', 'utf8') : '',
  quality: existsSync('.github/workflows/quality-check.yml') ? readFileSync('.github/workflows/quality-check.yml', 'utf8') : ''
};
const all = Object.values(files).join('\n');
const errors = [];
const has = (src, token, label) => { if (!src.includes(token)) errors.push(`missing ${label}: ${token}`); };

if (!['1.0.74', '1.0.75', '1.0.76', '1.0.77', '1.0.78', '1.0.79', '1.0.80', '1.0.81', '1.0.82', '1.0.83'].includes(files.pkg.version)) errors.push(`package version must be 1.0.74 or 1.0.75, got ${files.pkg.version}`);
[
  'v1074-lobby-menu-focus-trap',
  'v1074-lobby-panel-content-density',
  'v1074-lobby-menu-tap-target-qa',
  'dream-library-cache-v1.0.74',
  'texture-atlas-manifest-v1.0.74.json'
].forEach((token) => has(all, token, `v1.0.74 token ${token}`));
[
  'id="lobby-panel-route-hint"',
  'data-lobby-menu-focus-trap="v1074-lobby-menu-focus-trap"',
  'data-lobby-panel-content-density="v1074-lobby-panel-content-density"',
  'data-lobby-menu-tap-target-qa="v1074-lobby-menu-tap-target-qa"'
].forEach((token) => has(files.html, token, `v1.0.74 lobby menu markup ${token}`));
[
  'function trapLobbyMenuFocus(event: KeyboardEvent)',
  'function getLobbyMenuFocusableNodes()',
  "event.stopImmediatePropagation();",
  "if (event.key === 'Tab') trapLobbyMenuFocus(event);",
  'lobbyPanelScrollTop',
  'dream-library-lobby-panel-scroll-top',
  'lobbyPanelRouteHint',
  'LOBBY_MENU_FOCUS_TRAP_PATCH',
  'LOBBY_PANEL_CONTENT_DENSITY_PATCH',
  'LOBBY_MENU_TAP_TARGET_QA_PATCH'
].forEach((token) => has(files.main, token, `v1.0.74 runtime ${token}`));
[
  '.lobby-menu-overlay[data-lobby-menu-focus-trap="v1074-lobby-menu-focus-trap"]',
  '.lobby-panel-route-hint[data-lobby-panel-content-density="v1074-lobby-panel-content-density"]',
  '.lobby-panel-dock[data-lobby-panel-content-density="v1074-lobby-panel-content-density"]',
  '.lobby-menu-tabs[data-lobby-menu-tap-target-qa="v1074-lobby-menu-tap-target-qa"]',
  'body.lobby-menu-tight .lobby-panel-route-hint'
].forEach((token) => has(files.css, token, `v1.0.74 CSS ${token}`));
has(files.pages, 'npm run check:lobby-menu-focus-density', 'GitHub Pages v1.0.74 QA hook');
has(files.quality, 'npm run check:lobby-menu-focus-density', 'Quality v1.0.74 QA hook');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.74.json')) errors.push('missing v1.0.74 texture atlas manifest');
if (files.main.includes("el.lobbyMenuOverlay?.setAttribute('data-lobby-menu-motion-state', LOBBY_MENU_MOTION_STATE_PATCH);\n  el.lobbyMenuOverlay?.setAttribute('data-lobby-menu-motion-state', LOBBY_MENU_MOTION_STATE_PATCH);")) errors.push('duplicate lobby menu motion state setAttribute returned');
if (files.main.includes("if (event.key === 'Escape' && document.body.classList.contains('lobby-menu-open')) closeLobbyMenuPanel")) errors.push('old Escape handler can still trigger exit popup after menu close');
if (files.html.includes('☝')) errors.push('finger glyph must not return in start CTA');
if (files.html.includes('DELETE_REMOVED')) errors.push('DELETE_REMOVED file/copy must not be present');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Lobby menu focus/density QA passed: v1.0.74 focus trap, tap target, panel density and Escape isolation are present.');
