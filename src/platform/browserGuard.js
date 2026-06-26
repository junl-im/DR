const kakaoInAppPatterns = [
  /KAKAOTALK/i,
  /KakaoTalk/i,
  /KAKAO/i
];

const TIP_KEY = 'dream-library-kakao-portrait-tip-shown';

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

  const show = (message) => {
    if (!guard || !isKakao) return;
    setStatus(message);
    guard.classList.remove('hidden');
    guard.classList.add('kakao-inline-assist');
    document.documentElement.classList.add('kakao-assist-visible');
    sessionStorage.setItem(TIP_KEY, 'yes');
  };

  const requestPortraitFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      }
    } catch {
      // Kakao/iOS can reject fullscreen. CSS viewport lock and portrait overlay remain active.
    }
    try {
      if (screen.orientation?.lock) await screen.orientation.lock('portrait');
    } catch {
      // Best effort only.
    }
    setStatus('카카오톡 안에서 세로 전체화면 플레이를 유지합니다.');
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
  if (!isKakao) hide();

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
      if (!isKakao) return false;
      show('카카오톡 안에서 그대로 실행합니다. 세로 전체화면을 다시 적용합니다.');
      await requestPortraitFullscreen();
      return false;
    },
    showRecovery(message = '카카오톡 안에서 그대로 실행합니다. 화면은 세로 전체화면 기준으로 고정됩니다.') {
      show(message);
    },
    maybeShowSoftTip() {
      if (isKakao && sessionStorage.getItem(TIP_KEY) !== 'yes') {
        show('다른 앱으로 이동하지 않습니다. 카카오톡 안에서 세로 전체화면으로 플레이합니다.');
      }
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
