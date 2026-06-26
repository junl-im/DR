const MOBILE_PATTERNS = [/Android/i, /iPhone/i, /iPad/i, /iPod/i, /KAKAOTALK/i, /KakaoTalk/i, /KAKAO/i];
const PORTRAIT_RATIO = 9 / 16;
const MAX_APP_WIDTH = 560;

function readRawViewport() {
  const vv = window.visualViewport;
  const width = Math.max(1, Math.round(vv?.width || window.innerWidth || document.documentElement.clientWidth || 390));
  const height = Math.max(1, Math.round(vv?.height || window.innerHeight || document.documentElement.clientHeight || 844));
  return { width, height };
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
      sourceLandscape,
      virtualPortrait: false
    };
  }

  if (sourceLandscape) {
    const height = raw.height;
    const width = Math.max(220, Math.min(Math.round(height * PORTRAIT_RATIO), raw.width, MAX_APP_WIDTH));
    return {
      rawWidth: raw.width,
      rawHeight: raw.height,
      appWidth: width,
      appHeight: height,
      sourceLandscape,
      virtualPortrait: true
    };
  }

  return {
    rawWidth: raw.width,
    rawHeight: raw.height,
    appWidth: Math.min(raw.width, MAX_APP_WIDTH),
    appHeight: raw.height,
    sourceLandscape,
    virtualPortrait: true
  };
}

export function applyPortraitFrame(options = {}) {
  const root = document.documentElement;
  const mobileLike = options.forcePortrait ?? isMobileLikeViewport();
  const frame = computePortraitFrame(mobileLike);

  root.style.setProperty('--raw-width', `${frame.rawWidth}px`);
  root.style.setProperty('--raw-height', `${frame.rawHeight}px`);
  root.style.setProperty('--app-width', `${frame.appWidth}px`);
  root.style.setProperty('--app-height', `${frame.appHeight}px`);
  root.classList.toggle('portrait-runtime', mobileLike);
  root.classList.toggle('source-landscape', frame.sourceLandscape && mobileLike);
  root.classList.toggle('landscape-locked', false);

  document.body.dataset.orientation = 'portrait';
  document.body.dataset.sourceOrientation = frame.sourceLandscape ? 'landscape' : 'portrait';
  document.body.dataset.viewportFrame = frame.virtualPortrait ? 'virtual-portrait' : 'native';

  return frame;
}
