const MOBILE_PATTERNS = [/Android/i, /iPhone/i, /iPad/i, /iPod/i, /KAKAOTALK/i, /KakaoTalk/i, /KAKAO/i];
const PORTRAIT_RATIO = 9 / 16;
const MAX_APP_WIDTH = 560;
const MIN_APP_WIDTH = 320;
const FRAME_KEY = 'dream-library-last-portrait-frame';

function readStableViewport() {
  const vv = window.visualViewport;
  const candidates = [
    { width: vv?.width, height: vv?.height },
    { width: window.innerWidth, height: window.innerHeight },
    { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight }
  ].map((item) => ({
    width: Math.max(1, Math.round(Number(item.width) || 0)),
    height: Math.max(1, Math.round(Number(item.height) || 0))
  })).filter((item) => item.width > 1 && item.height > 1);

  const portrait = candidates.find((item) => item.height >= item.width);
  if (portrait) return portrait;
  return candidates[0] || { width: 390, height: 844 };
}

function readRawViewport() {
  return readStableViewport();
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
  const directWidth = Math.max(1, Math.round(window.visualViewport?.width || window.innerWidth || raw.width));
  const directHeight = Math.max(1, Math.round(window.visualViewport?.height || window.innerHeight || raw.height));
  const sourceLandscape = directWidth > directHeight;

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
    const stored = readStoredPortraitFrame();
    const fallbackWidth = Math.max(MIN_APP_WIDTH, Math.min(raw.height, MAX_APP_WIDTH));
    const fallbackHeight = Math.round(fallbackWidth / PORTRAIT_RATIO);
    const appWidth = stored?.appWidth || fallbackWidth;
    const appHeight = stored?.appHeight || Math.max(fallbackHeight, Math.round(appWidth / PORTRAIT_RATIO));
    const appScale = Math.max(0.48, Math.min(1, raw.width / appWidth, raw.height / appHeight));
    return {
      rawWidth: raw.width,
      rawHeight: raw.height,
      appWidth,
      appHeight,
      appScale,
      sourceLandscape,
      virtualPortrait: true
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
