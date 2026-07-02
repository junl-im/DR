import { readFileSync, existsSync } from 'node:fs';

const files = {
  pkg: JSON.parse(readFileSync('package.json', 'utf8')),
  html: readFileSync('index.html', 'utf8'),
  main: readFileSync('src/main.ts', 'utf8'),
  css: readFileSync('src/styles.css', 'utf8'),
  sw: readFileSync('public/sw.js', 'utf8'),
  handoff: existsSync('AI_HANDOFF_DR.md') ? readFileSync('AI_HANDOFF_DR.md', 'utf8') : '',
  pages: existsSync('.github/workflows/github-pages.yml') ? readFileSync('.github/workflows/github-pages.yml', 'utf8') : '',
  quality: existsSync('.github/workflows/quality-check.yml') ? readFileSync('.github/workflows/quality-check.yml', 'utf8') : ''
};
const all = Object.values(files).filter((value) => typeof value === 'string').join('\n');
const errors = [];
const has = (src, token, label) => { if (!src.includes(token)) errors.push(`missing ${label}: ${token}`); };
const lacks = (src, token, label) => { if (src.includes(token)) errors.push(`must remove ${label}: ${token}`); };

if (!['1.0.76', '1.0.77', '1.0.78', '1.0.79', '1.0.80', '1.0.81', '1.0.82', '1.0.83', '1.0.85'].includes(files.pkg.version)) errors.push(`package version must be 1.0.76+ compatibility range through 1.0.77, got ${files.pkg.version}`);
if (!Object.prototype.hasOwnProperty.call(files.pkg.scripts || {}, 'check:lobby-navigation-rhythm')) errors.push('missing v1.0.76 package script key: check:lobby-navigation-rhythm');
[
  'v1076-shortcut-menu-icon-polish',
  'v1076-panel-scroll-qa',
  'v1076-modal-close-flow',
  'v1076-lobby-navigation-rhythm',
  'dream-library-cache-v1.0.76',
  'texture-atlas-manifest-v1.0.76.json'
].forEach((token) => has(all, token, `v1.0.76 token ${token}`));
[
  'data-shortcut-menu-icon-polish="v1076-shortcut-menu-icon-polish"',
  'data-modal-close-flow="v1076-modal-close-flow"',
  'data-panel-scroll-qa="v1076-panel-scroll-qa"',
  'data-lobby-navigation-rhythm="v1076-lobby-navigation-rhythm"',
  'aria-label="스테이지 월드맵 열기"',
  'aria-label="내 진행과 복원 기록 열기"'
].forEach((token) => has(files.html, token, `v1.0.76 markup ${token}`));
[
  'const SHORTCUT_MENU_ICON_POLISH_PATCH',
  'const PANEL_SCROLL_QA_PATCH',
  'const MODAL_CLOSE_FLOW_PATCH',
  'const LOBBY_NAVIGATION_RHYTHM_PATCH',
  'function setLobbyNavigationRhythm',
  'function saveLobbyPanelScroll',
  'function restoreLobbyPanelScroll',
  "addEventListener('pointerdown'",
  "addEventListener('pointerup'",
  'state.lobbyMenuBackdropPointerId',
  'requestAnimationFrame(() => requestAnimationFrame(apply))',
  'dataset.modalCloseFlow',
  'dataset.lobbyNavigationRhythm'
].forEach((token) => has(files.main, token, `v1.0.76 runtime ${token}`));
[
  '.lobby-menu-hub[data-shortcut-menu-icon-polish="v1076-shortcut-menu-icon-polish"]',
  '.lobby-panel-dock[data-panel-scroll-qa="v1076-panel-scroll-qa"]',
  '.lobby-menu-overlay[data-modal-close-flow="v1076-modal-close-flow"]',
  'body.lobby-nav-opening[data-lobby-navigation-rhythm="v1076-lobby-navigation-rhythm"]',
  '@keyframes lobbyNavRhythmOpenV1076'
].forEach((token) => has(files.css, token, `v1.0.76 CSS ${token}`));
[
  'npm run check:lobby-navigation-rhythm'
].forEach((token) => {
  has(files.pages, token, 'GitHub Pages v1.0.76 QA hook');
  has(files.quality, token, 'Quality v1.0.76 QA hook');
});
[
  'GitHub Desktop',
  'Firebase 무료',
  'npm run build:github',
  'npm run build:firebase',
  'npm run check:lobby-navigation-rhythm',
  '풀파일 ZIP',
  '패치 ZIP',
  'package-lock.json 제외',
  'v1.0.76'
].forEach((token) => has(files.handoff, token, `handoff required note ${token}`));

lacks(files.main, "el.lobbyMenuOverlay?.addEventListener('click', (event) => { if (event.target === el.lobbyMenuOverlay)", 'old click-only backdrop close flow');
lacks(files.main, 'panel?.scrollIntoView({ block: \'start\'', 'old panel scrollIntoView jump');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.76.json')) errors.push('missing v1.0.76 texture atlas manifest');
if (files.html.includes('DELETE_REMOVED') || files.main.includes('DELETE_REMOVED')) errors.push('DELETE_REMOVED copy must not be present');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Lobby navigation rhythm QA passed: v1.0.76+ icon polish, panel scroll QA, pointer close flow, handoff and workflow hooks are present.');
