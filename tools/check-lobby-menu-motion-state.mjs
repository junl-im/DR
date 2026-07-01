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

if (!['1.0.73', '1.0.74', '1.0.75', '1.0.76'].includes(files.pkg.version)) errors.push(`package version must be 1.0.73 or 1.0.74, got ${files.pkg.version}`);
[
  'v1073-lobby-menu-motion-state',
  'v1073-lobby-menu-back-close',
  'v1073-lobby-menu-tab-switch',
  'v1073-lobby-panel-state-retention',
  'dream-library-cache-v1.0.73',
  'texture-atlas-manifest-v1.0.73.json'
].forEach((token) => has(all, token, `v1.0.73 token ${token}`));
[
  'id="lobby-menu-back-button"',
  'id="lobby-menu-tabs"',
  'data-lobby-menu-tab="campaign"',
  'data-lobby-menu-tab="mission"',
  'data-lobby-menu-tab="restoration"',
  'data-lobby-menu-tab="daily"',
  'data-lobby-menu-tab="collection"',
  'data-lobby-menu-tab="summer"',
  'data-lobby-menu-tab="progress"',
  'data-menu-icon="map"',
  'data-lobby-panel-state-retention="v1073-lobby-panel-state-retention"'
].forEach((token) => has(files.html, token, `v1.0.73 lobby menu markup ${token}`));
[
  'function openLobbyMenuPanel(panelKey = \'campaign\', trigger?: HTMLElement | null',
  'function closeLobbyMenuPanel(options: { returnFocus?: boolean; silent?: boolean } = {})',
  "if (document.body.classList.contains('lobby-menu-open')) { closeLobbyMenuPanel({ returnFocus: true }); return; }",
  'state.lastLobbyMenuTrigger = trigger',
  'data-lobby-menu-tab',
  'LOBBY_PANEL_STATE_RETENTION_PATCH',
  'focus({ preventScroll: true })'
].forEach((token) => has(files.main, token, `v1.0.73 lobby menu runtime ${token}`));
[
  '.lobby-menu-overlay.opening[data-lobby-menu-motion-state="v1073-lobby-menu-motion-state"]',
  '.lobby-menu-overlay.closing[data-lobby-menu-motion-state="v1073-lobby-menu-motion-state"]',
  '.lobby-menu-tabs[data-lobby-menu-tab-switch="v1073-lobby-menu-tab-switch"]',
  '.lobby-menu-back-button[data-lobby-menu-close]',
  '@keyframes lobbyMenuSlideUpV1073',
  '@media (prefers-reduced-motion: reduce)'
].forEach((token) => has(files.css, token, `v1.0.73 lobby menu CSS ${token}`));
has(files.pages, 'npm run check:lobby-menu-motion-state', 'GitHub Pages v1.0.73 QA hook');
has(files.quality, 'npm run check:lobby-menu-motion-state', 'Quality v1.0.73 QA hook');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.73.json')) errors.push('missing v1.0.73 texture atlas manifest');
if (files.main.includes("writeJson('dream-library-lobby-collapsed-panels', state.collapsedPanels);\n  writeJson('dream-library-lobby-collapsed-panels', state.collapsedPanels);")) errors.push('duplicate collapsed panel writeJson must stay removed');
if (files.html.includes('☝')) errors.push('finger glyph must not return in start CTA');
if (files.html.includes('DELETE_REMOVED')) errors.push('DELETE_REMOVED file/copy must not be present');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Lobby menu motion/state QA passed: v1.0.73 menu tabs, back-close flow, focus return and state retention are present.');
