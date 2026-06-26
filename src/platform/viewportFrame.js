const MOBILE_PATTERNS = [/Android/i, /iPhone/i, /iPad/i, /iPod/i, /KAKAOTALK/i, /KakaoTalk/i, /KAKAO/i];
const PORTRAIT_RATIO = 9 / 16;
const MAX_APP_WIDTH = 560;
const MIN_APP_WIDTH = 180;

function readRawViewport() {
  const vv = window.visualViewport;
  const width = Math.max(1, Math.round(vv?.width || window.innerWidth || document.documentElement.clientWidth || 390));
  const height = Math.max(1, Math.round(vv?.height || window.innerHeight || document.documentElement.clientHeight || 844));
  return { width, height };
}

function readOrientationAngle() {
  const angle = Number(screen.orientation?.angle ?? window.orientation ?? 0);
  if (!Number.isFinite(angle)) return 0;
  if (angle === 270) return -90;
  if (angle === -270) return 90;
  return angle;
}

function pickCounterRotation(sourceLandscape) {
  // v1.0.19: do not rotate the game shell.  The app stays visually portrait
  // by fitting a 9:16 frame inside the current viewport instead of turning UI sideways.
  return '0deg';
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
      virtualPortrait: false,
      counterRotated: false,
      rotation: '0deg'
    };
  }

  if (sourceLandscape) {
    // In mobile in-app browsers the physical viewport can become landscape even when
    // the game is designed as portrait-only.  Do not use raw width as app width and
    // do not counter-rotate the UI; fit a vertical 9:16 frame inside the visible area.
    const fitHeight = raw.height;
    const fitWidth = Math.max(120, Math.min(MAX_APP_WIDTH, Math.round(fitHeight * PORTRAIT_RATIO)));
    const portraitWidth = Math.max(Math.min(MIN_APP_WIDTH, raw.height), fitWidth);
    const portraitHeight = Math.max(fitHeight, Math.round(portraitWidth / PORTRAIT_RATIO));
    return {
      rawWidth: raw.width,
      rawHeight: raw.height,
      appWidth: Math.min(portraitWidth, raw.width),
      appHeight: Math.min(portraitHeight, raw.height),
      sourceLandscape,
      virtualPortrait: true,
      counterRotated: false,
      rotation: '0deg'
    };
  }

  const portraitWidth = Math.max(MIN_APP_WIDTH, Math.min(raw.width, MAX_APP_WIDTH));
  return {
    rawWidth: raw.width,
    rawHeight: raw.height,
    appWidth: portraitWidth,
    appHeight: raw.height,
    sourceLandscape,
    virtualPortrait: true,
    counterRotated: false,
    rotation: '0deg'
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
  root.style.setProperty('--portrait-rotation', frame.rotation);
  root.classList.toggle('portrait-runtime', mobileLike);
  root.classList.toggle('source-landscape', frame.sourceLandscape && mobileLike);
  root.classList.toggle('counter-rotated-portrait', false);
  root.classList.toggle('landscape-locked', false);

  document.body.dataset.orientation = 'portrait';
  document.body.dataset.sourceOrientation = frame.sourceLandscape ? 'landscape' : 'portrait';
  document.body.dataset.viewportFrame = frame.virtualPortrait ? 'virtual-portrait' : 'native';
  document.body.dataset.counterRotated = frame.counterRotated ? 'yes' : 'no';

  return frame;
}
