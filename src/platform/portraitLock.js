const KAKAO_PATTERNS = [/KAKAOTALK/i, /KakaoTalk/i, /KAKAO/i];
const MOBILE_PATTERNS = [/Android/i, /iPhone/i, /iPad/i, /iPod/i];
const LOCK_KEY = 'dream-library-portrait-lock-applied';

export function initPortraitRuntimeGuard(options = {}) {
  const userAgent = navigator.userAgent || '';
  const isKakao = KAKAO_PATTERNS.some((pattern) => pattern.test(userAgent));
  const isMobile = MOBILE_PATTERNS.some((pattern) => pattern.test(userAgent));
  const overlay = document.querySelector('#portrait-lock-overlay');
  const actionButton = document.querySelector('#portrait-lock-action-button');
  const continueButton = document.querySelector('#portrait-lock-continue-button');
  const status = document.querySelector('#portrait-lock-status');
  const root = document.documentElement;
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
    const vv = window.visualViewport;
    const width = Math.round(vv?.width || window.innerWidth || root.clientWidth || 390);
    const height = Math.round(vv?.height || window.innerHeight || root.clientHeight || 844);
    root.style.setProperty('--app-width', `${width}px`);
    root.style.setProperty('--app-height', `${height}px`);
    root.classList.toggle('portrait-runtime', isMobile || isKakao);
    root.classList.toggle('kakao-runtime', isKakao);

    const landscape = width > height;
    root.classList.toggle('landscape-locked', landscape && (isMobile || isKakao));
    document.body.dataset.orientation = landscape ? 'landscape' : 'portrait';
    document.body.dataset.fullscreenRuntime = isKakao ? 'kakao-inapp' : isMobile ? 'mobile' : 'desktop';
    if (!landscape && overlay) overlay.classList.add('hidden');
    return { width, height, landscape };
  };

  const requestLock = async (source = 'auto') => {
    syncViewport();
    requestCount += 1;
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      }
    } catch {
      // Kakao/iOS may reject fullscreen. CSS viewport lock still keeps the game in portrait layout.
    }

    try {
      if (screen.orientation?.lock) await screen.orientation.lock('portrait');
    } catch {
      // Best-effort only. The fallback overlay prevents horizontal game layout.
    }

    const view = syncViewport();
    sessionStorage.setItem(LOCK_KEY, 'yes');
    if (isKakao) {
      setStatus(view.landscape ? '세로 전체화면으로 고정 중입니다. 기기를 세로로 돌리면 바로 이어집니다.' : '카카오톡 안에서 세로 전체화면 플레이를 유지합니다.');
    } else if (source === 'button') {
      setStatus(view.landscape ? '세로 화면으로 전환해 주세요.' : '세로 전체화면 모드를 적용했습니다.');
    }
    return !view.landscape;
  };

  const showOverlay = (message = '세로 전체화면으로 고정 중입니다.') => {
    if (!overlay || !(isMobile || isKakao)) return;
    setStatus(message);
    overlay.classList.remove('hidden');
  };

  const maybeShowLandscapeOverlay = () => {
    const view = syncViewport();
    if (view.landscape && (isMobile || isKakao)) showOverlay('꿈의 서고는 세로 9:16 전용입니다. 화면을 세로로 고정해 플레이합니다.');
    return view;
  };

  actionButton?.addEventListener('click', () => requestLock('button'));
  continueButton?.addEventListener('click', () => {
    syncViewport();
    overlay?.classList.add('hidden');
    setStatus('세로 화면에서 계속 진행합니다.');
  });

  const onResize = () => maybeShowLandscapeOverlay();
  window.addEventListener('resize', onResize, { passive: true });
  window.visualViewport?.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', () => window.setTimeout(() => {
    maybeShowLandscapeOverlay();
    if (isKakao || isMobile) void requestLock('orientationchange');
  }, 80), { passive: true });

  const gestureLock = (event) => {
    if (!(isKakao || isMobile)) return;
    if (!isTapLikeGesture(event)) return;
    if (requestCount >= 3 && sessionStorage.getItem(LOCK_KEY) === 'yes') return;
    void requestLock('gesture');
  };
  document.addEventListener('pointerdown', rememberGestureStart, { passive: true });
  document.addEventListener('touchstart', rememberGestureStart, { passive: true });
  document.addEventListener('pointerup', gestureLock, { passive: true });
  document.addEventListener('touchend', gestureLock, { passive: true });

  syncViewport();
  maybeShowLandscapeOverlay();
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
