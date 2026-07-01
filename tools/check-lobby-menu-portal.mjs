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

if (!['1.0.72', '1.0.73', '1.0.74', '1.0.75', '1.0.76', '1.0.77', '1.0.78', '1.0.79', '1.0.80'].includes(files.pkg.version)) errors.push(`package version must be 1.0.72 or 1.0.73, got ${files.pkg.version}`);
[
  'v1072-lobby-menu-portal',
  'v1072-section-popup-restructure',
  'v1072-rounded-card-content-readability',
  'dream-library-cache-v1.0.72',
  'texture-atlas-manifest-v1.0.72.json'
].forEach((token) => has(all, token, `v1.0.72 token ${token}`));
[
  'id="lobby-menu-hub"',
  'data-lobby-menu-open="campaign"',
  'data-lobby-menu-open="mission"',
  'data-lobby-menu-open="restoration"',
  'data-lobby-menu-open="daily"',
  'data-lobby-menu-open="collection"',
  'data-lobby-menu-open="summer"',
  'data-lobby-menu-open="progress"',
  'id="lobby-menu-overlay"',
  'id="lobby-panel-dock"',
  'data-lobby-panel="campaign"',
  'data-lobby-panel="progress"'
].forEach((token) => has(files.html, token, `lobby portal markup ${token}`));
[
  'function openLobbyMenuPanel',
  'function closeLobbyMenuPanel',
  'function syncLobbyMenuPortal',
  'getLobbyPanelKeyForSelector',
  'ACTIVE_LOBBY_PANEL_KEY',
  'data-rounded-content-readable'
].forEach((token) => has(files.main, token, `lobby portal runtime ${token}`));
[
  '.lobby-menu-hub',
  '.lobby-menu-overlay',
  '.lobby-panel-dock',
  'body.lobby-menu-open',
  '.reward-restoration-bridge[data-rounded-content-readable="v1072-rounded-card-content-readability"]'
].forEach((token) => has(files.css, token, `lobby portal CSS ${token}`));
has(files.pages, 'npm run check:lobby-menu-portal', 'GitHub Pages v1.0.72 QA hook');
has(files.quality, 'npm run check:lobby-menu-portal', 'Quality v1.0.72 QA hook');
if (files.html.includes('☝')) errors.push('finger glyph must not return in start CTA');
if (files.html.includes('DELETE_REMOVED')) errors.push('DELETE_REMOVED file/copy must not be present');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Lobby menu portal QA passed: v1.0.72 lobby menu hub, popup sections and rounded content readability are present.');
