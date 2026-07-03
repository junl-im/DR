import { readFileSync, existsSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const html = readFileSync('index.html', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const sw = readFileSync('public/sw.js', 'utf8');
const difficulty = readFileSync('src/game/difficulty.js', 'utf8');
const pages = existsSync('.github/workflows/github-pages.yml') ? readFileSync('.github/workflows/github-pages.yml', 'utf8') : '';
const quality = existsSync('.github/workflows/quality-check.yml') ? readFileSync('.github/workflows/quality-check.yml', 'utf8') : '';
const handoff = existsSync('AI_HANDOFF_DR.md') ? readFileSync('AI_HANDOFF_DR.md', 'utf8') : '';

const errors = [];
const has = (src, token, label) => { if (!src.includes(token)) errors.push(`missing ${label}: ${token}`); };
const lacks = (src, token, label) => { if (src.includes(token)) errors.push(`must remove ${label}: ${token}`); };

if (pkg.version !== '1.0.88') errors.push(`package version must be 1.0.88, got ${pkg.version}`);
if (!Object.prototype.hasOwnProperty.call(pkg.scripts || {}, 'check:lobby-bottom-shortcut')) errors.push('missing package script check:lobby-bottom-shortcut');

has(html, 'id="lobby-menu-hub" class="lobby-menu-hub luxury-panel"', 'single fixed shortcut hub without floating animation class');
has(html, 'data-lobby-shortcut-placement="bottom-fixed" data-lobby-shortcut-nav-dock="v1090-lobby-shortcut-nav-dock" aria-label="바로가기 메뉴"', 'bottom fixed shortcut hub marker');
has(html, 'id="lobby-menu-overlay"', 'existing lobby menu overlay');
has(html, 'data-lobby-shortcut-placement="bottom-fixed" data-lobby-shortcut-nav-dock="v1090-lobby-shortcut-nav-dock" role="dialog"', 'popup keeps bottom shortcut placement marker');
has(html, 'id="lobby-panel-dock"', 'existing lobby panel dock');
has(html, 'id="lobby-menu-back-button" type="button" class="secondary lobby-menu-back-button" data-lobby-menu-close aria-label="바로가기 메뉴 뒤로가기">‹ 뒤로</button>', 'unified arrow back button');
lacks(html, 'id="lobby-menu-close-button"', 'separate popup close icon button');
has(html, 'data-lobby-shortcut-placement="bottom-fixed"', 'panel dock bottom spacing marker');

has(css, 'body[data-screen="lobby"] #lobby-menu-hub[data-lobby-shortcut-placement="bottom-fixed"]', 'lobby fixed bottom CSS');
has(css, 'position: fixed;', 'fixed bottom shortcut position');
has(css, 'v1090-lobby-shortcut-nav-dock', 'v1.0.90 shortcut dock marker');
has(css, 'position: fixed !important;', 'fixed viewport shortcut position guard');
has(css, 'scroll-snap-type: x mandatory;', 'shortcut overflow swipe snap');
has(css, 'touch-action: pan-x;', 'shortcut horizontal pan gesture');
has(css, 'background-image: none;', 'unified back button avoids separate back image');
has(css, 'bottom: var(--lobby-shortcut-bottom-gap);', 'safe-area bottom gap');
has(css, 'z-index: 110;', 'shortcut above lobby overlay and below modal stack');
has(css, 'animation: none;', 'fixed shortcut floating animation removed');
has(css, 'body[data-screen="game"] #lobby-menu-hub[data-lobby-shortcut-placement="bottom-fixed"]', 'game screen hide CSS');
has(css, '.lobby-menu-overlay[data-lobby-shortcut-placement="bottom-fixed"]', 'overlay reserves bottom shortcut space');
has(css, 'max-height: min(760px, calc(100dvh - var(--lobby-shortcut-reserved-space)', 'popup card height avoids fixed shortcut');

has(main, 'function initLobbyScrollGuard()', 'existing scroll guard was edited in place');
has(main, 'document.body.dataset.lobbyDragRescue = LOBBY_DRAG_DEEP_RESCUE_PATCH;', 'drag click guard marker remains');
has(main, 'const LOBBY_SHORTCUT_NAV_DOCK_PATCH', 'shortcut nav dock runtime marker');
has(main, 'document.body.dataset.lobbyShortcutNavDock = LOBBY_SHORTCUT_NAV_DOCK_PATCH;', 'shortcut nav dock body marker');
lacks(main, 'lobbyMenuCloseButton', 'removed separate close button wiring');
lacks(main, 'shell.scrollTop -=', 'manual pointer delta scrollTop correction');
lacks(main, 'deltaY * 1.28', 'old forced scroll multiplier');
lacks(main, 'let lastY = 0;', 'old drag scroll tracking state');
lacks(main, 'function installV1088', 'new versioned install pass function');
lacks(main, 'function syncV1088', 'new versioned sync ui function');

has(sw, 'dream-library-cache-v1.0.88', 'current service worker cache');
has(sw, 'texture-atlas-manifest-v1.0.88.json', 'current service worker atlas manifest');
has(difficulty, 'texture-atlas-manifest-v1.0.88.json', 'difficulty atlas manifest preload');
has(pages, 'npm run check:lobby-bottom-shortcut', 'GitHub Pages QA hook');
has(quality, 'npm run check:lobby-bottom-shortcut', 'Quality QA hook');
has(handoff, 'v1.0.88', 'handoff v1.0.88 record');
has(handoff, 'v1.0.90', 'handoff v1.0.90 record');
has(handoff, '수동 scrollTop 보정 삭제', 'handoff deletion note');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Lobby bottom shortcut QA passed: existing hub is fixed to the lobby bottom, popup spacing is reserved, game screen is hidden, and forced scrollTop correction was deleted.');
