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
    const view = applyPortraitFrame({ forcePortrait: isMobile || isKakao, reason: 'portrait-runtime' });
    document.body.dataset.fullscreenRuntime = isKakao ? 'kakao-inapp-soft' : isMobile ? 'mobile-soft' : 'desktop';
    overlay?.classList.add('hidden');
    return { width: view.appWidth, height: view.appHeight, landscape: false, sourceLandscape: view.sourceLandscape };
  };

  const requestLock = async (source = 'auto') => {
    // v1.0.25: In Kakao in-app browser, fullscreen/orientation APIs are skipped because
    // they can pin visualViewport to landscape after the lobby entry tap. The virtual
    // portrait frame is now the only automatic correction path.
    syncViewport();
    requestCount += 1;

    if (!isKakao) {
      try {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement && source === 'button') {
          await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
        }
      } catch {
        // Best effort only.
      }

      try {
        if (screen.orientation?.lock && source === 'button') await screen.orientation.lock('portrait');
      } catch {
        // Best effort only.
      }
    }

    syncViewport();
    sessionStorage.setItem(LOCK_KEY, 'yes');
    if (source === 'button') setStatus('');
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
    setStatus('');
  });

  const onResize = () => syncViewport();
  window.addEventListener('resize', onResize, { passive: true });
  window.visualViewport?.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', () => window.setTimeout(syncViewport, 80), { passive: true });
  document.addEventListener('dream-library:viewport-frame-requested', syncViewport);

  const gestureLock = (event) => {
    if (!(isKakao || isMobile)) return;
    if (!isTapLikeGesture(event)) return;
    if (requestCount >= 2 && sessionStorage.getItem(LOCK_KEY) === 'yes') return;
    syncViewport();
    requestCount += 1;
    sessionStorage.setItem(LOCK_KEY, 'yes');
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
