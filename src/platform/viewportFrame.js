const MOBILE_PATTERNS = [/Android/i, /iPhone/i, /iPad/i, /iPod/i, /KAKAOTALK/i, /KakaoTalk/i, /KAKAO/i];
const PORTRAIT_RATIO = 9 / 16;
const MAX_APP_WIDTH = 560;
const MIN_APP_WIDTH = 320;
const FRAME_KEY = 'dream-library-last-portrait-frame';
const lastPortraitFrame = FRAME_KEY;
const LANDSCAPE_HEIGHT_MARGIN = 14;

function readRawViewport() {
  const vv = window.visualViewport;
  const width = Math.max(1, Math.round(vv?.width || window.innerWidth || document.documentElement.clientWidth || 390));
  const height = Math.max(1, Math.round(vv?.height || window.innerHeight || document.documentElement.clientHeight || 844));
  return { width, height };
}

function readStoredPortraitFrame() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(FRAME_KEY) || 'null');
    if (!parsed || !Number.isFinite(parsed.appWidth) || !Number.isFinite(parsed.appHeight)) return null;
    if (parsed.appWidth < 240 || parsed.appHeight < 420) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredPortraitFrame(frame) {
  try {
    sessionStorage.setItem(FRAME_KEY, JSON.stringify({ appWidth: frame.appWidth, appHeight: frame.appHeight }));
  } catch {
    // Storage is optional. Runtime frame still works without it.
  }
}

export function isMobileLikeViewport() {
  const ua = navigator.userAgent || '';
  return MOBILE_PATTERNS.some((pattern) => pattern.test(ua)) || Math.min(window.innerWidth || 0, window.innerHeight || 0) <= 820;
}

export function computePortraitFrame(forcePortrait = isMobileLikeViewport()) {
  const raw = readRawViewport();
  const sourceLandscape = raw.width > raw.height;

  if (!forcePortrait) {
    return {
      rawWidth: raw.width,
      rawHeight: raw.height,
      appWidth: Math.min(raw.width, MAX_APP_WIDTH),
      appHeight: raw.height,
      appScale: 1,
      sourceLandscape,
      virtualPortrait: false
    };
  }

  if (sourceLandscape) {
    // v1.0.25: do not reuse a tall portrait-session frame after Kakao reports landscape.
    // Rebuild a fresh 9:16 virtual stage from the current short side so the app never
    // adopts the landscape width and never stays pinned to a stale orientation frame.
    const usableHeight = Math.max(320, raw.height - LANDSCAPE_HEIGHT_MARGIN);
    const baseWidth = Math.round(usableHeight * PORTRAIT_RATIO);
    const idealWidth = Math.max(MIN_APP_WIDTH, Math.min(baseWidth, MAX_APP_WIDTH, raw.width));
    const idealHeight = Math.round(idealWidth / PORTRAIT_RATIO);
    const appScale = Math.min(1, raw.width / idealWidth, usableHeight / idealHeight);
    const safeScale = Math.max(0.48, appScale);
    return {
      rawWidth: raw.width,
      rawHeight: raw.height,
      appWidth: idealWidth,
      appHeight: idealHeight,
      appScale: safeScale,
      sourceLandscape,
      virtualPortrait: true,
      fittedLandscape: true
    };
  }

  const appWidth = Math.max(MIN_APP_WIDTH, Math.min(raw.width, MAX_APP_WIDTH));
  const appHeight = Math.max(raw.height, Math.round(appWidth / PORTRAIT_RATIO));
  const frame = {
    rawWidth: raw.width,
    rawHeight: raw.height,
    appWidth,
    appHeight,
    appScale: 1,
    sourceLandscape,
    virtualPortrait: true
  };
  writeStoredPortraitFrame(frame);
  return frame;
}

export function applyPortraitFrame(options = {}) {
  const root = document.documentElement;
  const mobileLike = options.forcePortrait ?? isMobileLikeViewport();
  const frame = computePortraitFrame(mobileLike);

  root.style.setProperty('--raw-width', `${frame.rawWidth}px`);
  root.style.setProperty('--raw-height', `${frame.rawHeight}px`);
  root.style.setProperty('--app-width', `${frame.appWidth}px`);
  root.style.setProperty('--app-height', `${frame.appHeight}px`);
  root.style.setProperty('--app-scale', String(frame.appScale || 1));
  root.style.setProperty('--scaled-app-width', `${Math.round(frame.appWidth * (frame.appScale || 1))}px`);
  root.style.setProperty('--scaled-app-height', `${Math.round(frame.appHeight * (frame.appScale || 1))}px`);
  root.classList.toggle('portrait-runtime', mobileLike);
  root.classList.toggle('source-landscape', frame.sourceLandscape && mobileLike);
  root.classList.toggle('landscape-locked', false);

  document.body.dataset.orientation = 'portrait';
  document.body.dataset.sourceOrientation = frame.sourceLandscape ? 'landscape' : 'portrait';
  document.body.dataset.viewportFrame = frame.virtualPortrait ? 'virtual-portrait' : 'native';

  return frame;
}
