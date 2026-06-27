import { readFileSync } from 'node:fs';

const main = readFileSync('src/main.ts', 'utf8');
const portrait = readFileSync('src/platform/portraitLock.js', 'utf8');
const fullscreen = readFileSync('src/platform/fullscreen.js', 'utf8');
const browserGuard = readFileSync('src/platform/browserGuard.js', 'utf8');
const viewport = readFileSync('src/platform/viewportFrame.js', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const packageJson = readFileSync('package.json', 'utf8');

const errors = [];
const enterLobbyMatch = main.match(/function enterLobbyFromStart\(\) \{[\s\S]*?\n\}/);
if (!enterLobbyMatch) errors.push('enterLobbyFromStart is missing.');
else {
  const body = enterLobbyMatch[0];
  if (/requestGameFullscreen\s*\(/.test(body)) errors.push('enterLobbyFromStart must not call requestGameFullscreen.');
  if (/requestKakaoPortraitLock\s*\(/.test(body)) errors.push('enterLobbyFromStart must not call requestKakaoPortraitLock.');
  if (!/syncGameViewport/.test(body)) errors.push('enterLobbyFromStart must use syncGameViewport.');
}

const startStageMatch = main.match(/async function startSelectedStage\([^]*?state\.board = createBoard/);
if (!startStageMatch) errors.push('startSelectedStage block is missing.');
else {
  const body = startStageMatch[0];
  if (/requestGameFullscreen\s*\(\)/.test(body)) errors.push('stage start must not call bare requestGameFullscreen.');
  if (!/syncGameViewport/.test(body)) errors.push('stage start must sync the virtual portrait frame.');
}

if (!/Kakao in-app browsers can report a landscape visualViewport/.test(browserGuard)) errors.push('browserGuard must document the soft in-app frame policy.');
if (/document\.documentElement\.requestFullscreen[\s\S]{0,180}isKakao/.test(browserGuard)) errors.push('browserGuard must not request fullscreen for Kakao.');
if (!/hardRequest = options\.hard === true && !isKakaoInApp\(\)/.test(fullscreen)) errors.push('requestGameFullscreen must hard-skip Kakao in-app browsers.');
if (!/In Kakao in-app browser, fullscreen\/orientation APIs are skipped/.test(portrait)) errors.push('portraitLock must skip automatic fullscreen/orientation APIs in Kakao.');
if (!/window\.addEventListener\('orientationchange', \(\) => window\.setTimeout\(syncViewport, 80\)/.test(portrait)) errors.push('orientationchange must only sync viewport, not request orientation lock.');
if (!/do not reuse a tall portrait-session frame/.test(viewport)) errors.push('viewportFrame must rebuild landscape virtual frames from the current short side.');
if (!/html\.source-landscape \.app-shell[\s\S]*position: fixed/.test(css)) errors.push('CSS must pin the source-landscape app shell to a fixed centered portrait frame.');
if (!/check:kakao-lobby-rotation/.test(packageJson)) errors.push('package.json must expose check:kakao-lobby-rotation.');

if (errors.length) {
  console.error(`Kakao lobby rotation policy failed: ${errors.join('; ')}`);
  process.exit(1);
}
console.log('Kakao lobby rotation policy passed: lobby entry uses soft portrait frame and skips rotation APIs.');
