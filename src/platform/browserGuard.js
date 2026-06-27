import { applyPortraitFrame } from './viewportFrame.js';

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
    // Kakao in-app browsers can report a landscape visualViewport after fullscreen/orientation APIs.
    // Keep this path soft: recompute the virtual portrait frame only.
    applyPortraitFrame({ forcePortrait: true, reason: 'browser-guard-soft-fit' });
    setStatus('');
    document.dispatchEvent(new CustomEvent('dream-library:viewport-frame-requested'));
    return false;
  };

  fullscreenButton?.addEventListener('click', requestPortraitFullscreen);
  continueButton?.addEventListener('click', () => {
    hide();
    void requestPortraitFullscreen();
  });
  closeButton?.addEventListener('click', () => {
    hide();
    void requestPortraitFullscreen();
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
      document.dispatchEvent(new CustomEvent('dream-library:viewport-frame-requested'));
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
