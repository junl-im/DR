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
const lacks = (src, token, label) => { if (src.includes(token)) errors.push(`must remove ${label}: ${token}`); };

if (!['1.0.75', '1.0.76', '1.0.77'].includes(files.pkg.version)) errors.push(`package version must be 1.0.75 or 1.0.76, got ${files.pkg.version}`);
[
  'v1075-lobby-shortcut-menu-bar',
  'v1075-lobby-copy-cleanup',
  'v1075-lobby-scroll-stability',
  'dream-library-cache-v1.0.75',
  'texture-atlas-manifest-v1.0.75.json'
].forEach((token) => has(all, token, `v1.0.75 token ${token}`));
[
  'data-lobby-shortcut-bar="v1075-lobby-shortcut-menu-bar"',
  'data-lobby-scroll-stability="v1075-lobby-scroll-stability"',
  '<h3>서고 메뉴바</h3>',
  'aria-label="바로가기 메뉴"'
].forEach((token) => has(files.html, token, `shortcut markup ${token}`));
[
  'const LOBBY_SHORTCUT_MENU_BAR_PATCH',
  'const LOBBY_COPY_CLEANUP_PATCH',
  'const LOBBY_SCROLL_STABILITY_PATCH',
  'function getAppShellScroller()',
  "document.body.classList.add('lobby-menu-open', 'lobby-scroll-locked')",
  'state.lobbyPageScrollTopBeforeMenu',
  'dataset.lobbyScrollStability'
].forEach((token) => has(files.main, token, `shortcut runtime ${token}`));
[
  '.lobby-menu-hub[data-lobby-shortcut-bar="v1075-lobby-shortcut-menu-bar"]',
  'body.lobby-scroll-locked',
  '.lobby-panel-dock[data-lobby-scroll-stability="v1075-lobby-scroll-stability"]',
  'scroll-snap-type: x proximity'
].forEach((token) => has(files.css, token, `shortcut CSS ${token}`));
[
  'Library Menu',
  '필요한 구간만 열어보기',
  '상단 게임 시작은 그대로 두고',
  '구간을 선택하면 해당 내용을 크게 열어 확인합니다.',
  '<p class="eyebrow">Start Route</p>',
  '☝'
].forEach((token) => lacks(files.html + '\n' + files.main, token, `developer/player-facing copy ${token}`));
lacks(files.main, 'panel?.scrollIntoView({ block: \'start\'', 'menu panel scrollIntoView page jump');
has(files.pages, 'npm run check:lobby-shortcut-scroll', 'GitHub Pages v1.0.75 QA hook');
has(files.quality, 'npm run check:lobby-shortcut-scroll', 'Quality v1.0.75 QA hook');
if (!existsSync('public/assets/meta/texture-atlas-manifest-v1.0.75.json')) errors.push('missing v1.0.75 texture atlas manifest');
if (files.html.includes('DELETE_REMOVED')) errors.push('DELETE_REMOVED copy must not be present');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Lobby shortcut/scroll QA passed: v1.0.75 shortcut menu bar, copy cleanup and scroll stability are present.');
