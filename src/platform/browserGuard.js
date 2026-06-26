const kakaoInAppPatterns = [
  /KAKAOTALK/i,
  /KakaoTalk/i,
  /KAKAO/i
];

export function initBrowserGuard() {
  const userAgent = navigator.userAgent || '';
  const isKakao = kakaoInAppPatterns.some((pattern) => pattern.test(userAgent));
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const guard = document.querySelector('#browser-guard');
  const fullscreenButton = document.querySelector('#kakao-fullscreen-button');
  const continueButton = document.querySelector('#continue-inapp-button');
  const closeButton = document.querySelector('#kakao-guard-close-button');
  const status = document.querySelector('#guard-status');

  const setStatus = (message) => {
    if (status) status.textContent = message;
  };

  const hide = () => {
    guard?.classList.add('hidden');
    document.documentElement.classList.remove('kakao-assist-visible');
  };

  const requestPortraitFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      }
    } catch {
      // In-app browsers may reject fullscreen. Layout remains stable through the virtual portrait frame.
    }
    try {
      if (screen.orientation?.lock) await screen.orientation.lock('portrait');
    } catch {
      // Best effort only.
    }
    setStatus('게임 화면을 맞췄습니다.');
    document.dispatchEvent(new CustomEvent('dream-library:portrait-lock-requested'));
    return true;
  };

  fullscreenButton?.addEventListener('click', requestPortraitFullscreen);
  continueButton?.addEventListener('click', () => {
    hide();
    requestPortraitFullscreen();
  });
  closeButton?.addEventListener('click', () => {
    hide();
    requestPortraitFullscreen();
  });

  document.body.dataset.browser = isKakao ? 'kakao' : 'standard';
  hide();

  return {
    blocked: false,
    inApp: isKakao,
    platform: isAndroid ? 'android' : isIOS ? 'ios' : 'other',
    shouldUseHandoff() {
      return false;
    },
    shouldAssistAuth() {
      return false;
    },
    async startHandoff() {
      await requestPortraitFullscreen();
      return false;
    },
    showRecovery(_message = '') {
      hide();
      document.dispatchEvent(new CustomEvent('dream-library:portrait-lock-requested'));
    },
    maybeShowSoftTip() {
      hide();
    },
    continueInApp() {
      hide();
      void requestPortraitFullscreen();
    },
    requestPortraitFullscreen,
    hide
  };
}

export function isStandaloneDisplayMode() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
