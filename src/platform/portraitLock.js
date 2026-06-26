import { applyPortraitFrame } from './viewportFrame.js';

const KAKAO_PATTERNS = [/KAKAOTALK/i, /KakaoTalk/i, /KAKAO/i];
const MOBILE_PATTERNS = [/Android/i, /iPhone/i, /iPad/i, /iPod/i];
const LOCK_KEY = 'dream-library-portrait-frame-applied';

export function initPortraitRuntimeGuard(options = {}) {
  const userAgent = navigator.userAgent || '';
  const isKakao = KAKAO_PATTERNS.some((pattern) => pattern.test(userAgent));
  const isMobile = MOBILE_PATTERNS.some((pattern) => pattern.test(userAgent));
  const overlay = document.querySelector('#portrait-lock-overlay');
  const actionButton = document.querySelector('#portrait-lock-action-button');
  const continueButton = document.querySelector('#portrait-lock-continue-button');
  const status = document.querySelector('#portrait-lock-status');
  let requestCount = 0;
  let gestureStart = { x: 0, y: 0, time: 0 };

  const readPoint = (event) => {
    const touch = event.touches?.[0] || event.changedTouches?.[0] || event;
    return { x: Number(touch.clientX || 0), y: Number(touch.clientY || 0), time: performance.now() };
  };

  const rememberGestureStart = (event) => {
    gestureStart = readPoint(event);
  };

  const isTapLikeGesture = (event) => {
    const point = readPoint(event);
    const distance = Math.hypot(point.x - gestureStart.x, point.y - gestureStart.y);
    const duration = point.time - gestureStart.time;
    return distance <= 14 && duration <= 650;
  };

  const setStatus = (message) => {
    if (status) status.textContent = message;
    options.onStatus?.(message);
  };

  const syncViewport = () => {
    const view = applyPortraitFrame({ forcePortrait: isMobile || isKakao });
    document.body.dataset.fullscreenRuntime = isKakao ? 'kakao-inapp' : isMobile ? 'mobile' : 'desktop';
    overlay?.classList.add('hidden');
    return { width: view.appWidth, height: view.appHeight, landscape: false, sourceLandscape: view.sourceLandscape };
  };

  const requestLock = async (source = 'auto') => {
    syncViewport();
    requestCount += 1;
    try {
      if (screen.orientation?.lock) await screen.orientation.lock('portrait');
    } catch {
      // Best effort only. Counter-rotated portrait frame is the real layout fallback.
    }

    syncViewport();
    sessionStorage.setItem(LOCK_KEY, 'yes');
    if (source === 'button') setStatus('화면을 맞췄습니다.');
    return true;
  };

  const showOverlay = () => {
    syncViewport();
    overlay?.classList.add('hidden');
  };

  const maybeShowLandscapeOverlay = () => syncViewport();

  actionButton?.addEventListener('click', () => requestLock('button'));
  continueButton?.addEventListener('click', () => {
    syncViewport();
    overlay?.classList.add('hidden');
    setStatus('화면을 맞췄습니다.');
  });

  const onResize = () => syncViewport();
  window.addEventListener('resize', onResize, { passive: true });
  window.visualViewport?.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', () => window.setTimeout(() => {
    syncViewport();
    if (isKakao || isMobile) syncViewport();
  }, 80), { passive: true });

  const gestureLock = (event) => {
    if (!(isKakao || isMobile)) return;
    if (!isTapLikeGesture(event)) return;
    if (requestCount >= 2 && sessionStorage.getItem(LOCK_KEY) === 'yes') return;
    void requestLock('gesture');
  };
  document.addEventListener('pointerdown', rememberGestureStart, { passive: true });
  document.addEventListener('touchstart', rememberGestureStart, { passive: true });
  document.addEventListener('pointerup', gestureLock, { passive: true });
  document.addEventListener('touchend', gestureLock, { passive: true });

  syncViewport();
  if (isKakao) document.body.classList.add('kakao-portrait-runtime');

  return {
    isKakao,
    isMobile,
    syncViewport,
    requestLock,
    showOverlay,
    maybeShowLandscapeOverlay
  };
}
