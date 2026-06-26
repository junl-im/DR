const kakaoInAppPatterns = [
  /KAKAOTALK/i,
  /KakaoTalk/i,
  /KAKAO/i
];

const CONTINUE_KEY = 'dream-library-kakao-continue-inapp';

export function initBrowserGuard() {
  const userAgent = navigator.userAgent || '';
  const isKakao = kakaoInAppPatterns.some((pattern) => pattern.test(userAgent));
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const guard = document.querySelector('#browser-guard');
  const copyButton = document.querySelector('#copy-url-button');
  const openButton = document.querySelector('#open-external-button');
  const continueButton = document.querySelector('#continue-inapp-button');
  const status = document.querySelector('#guard-status');
  const currentUrl = window.location.href;

  const setStatus = (message) => {
    if (status) status.textContent = message;
  };

  const hide = () => {
    guard?.classList.add('hidden');
    document.documentElement.classList.remove('handoff-browser');
  };

  const show = (message) => {
    if (!guard) return;
    setStatus(message);
    guard.classList.remove('hidden');
    document.documentElement.classList.add('handoff-browser');
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setStatus('주소를 복사했습니다. 외부 브라우저 주소창에 붙여넣으면 이어서 시작됩니다.');
      return true;
    } catch {
      setStatus(currentUrl);
      return false;
    }
  };

  const openExternal = async () => {
    if (!isKakao) return false;
    if (isAndroid) {
      window.location.href = makeChromeIntentUrl(currentUrl);
      setStatus('Chrome으로 이어서 여는 중입니다. 돌아오면 아래 임시 플레이를 사용할 수 있습니다.');
      return true;
    }
    if (isIOS) {
      await copyUrl();
      show('iPhone 카카오 브라우저는 Safari 자동 전환이 제한될 수 있어 주소를 복사했습니다. Safari에서 붙여넣거나 임시 플레이로 계속하세요.');
      return true;
    }
    window.open(currentUrl, '_blank', 'noopener,noreferrer');
    setStatus('외부 브라우저 창을 여는 중입니다. 열리지 않으면 주소 복사를 사용하세요.');
    return true;
  };

  copyButton?.addEventListener('click', copyUrl);
  openButton?.addEventListener('click', openExternal);
  continueButton?.addEventListener('click', () => {
    sessionStorage.setItem(CONTINUE_KEY, 'yes');
    hide();
    setStatus('카카오 브라우저 임시 플레이를 허용했습니다. 일부 기능은 외부 브라우저보다 제한될 수 있습니다.');
  });

  if (!isKakao) hide();
  document.body.dataset.browser = isKakao ? 'kakao' : 'standard';

  return {
    blocked: false,
    inApp: isKakao,
    platform: isAndroid ? 'android' : isIOS ? 'ios' : 'other',
    shouldUseHandoff() {
      return isKakao && sessionStorage.getItem(CONTINUE_KEY) !== 'yes';
    },
    async startHandoff() {
      if (!isKakao) return false;
      show(isAndroid ? '외부 브라우저로 이어서 여는 중입니다.' : '외부 브라우저로 이어서 시작할 수 있도록 준비했습니다.');
      return openExternal();
    },
    continueInApp() {
      sessionStorage.setItem(CONTINUE_KEY, 'yes');
      hide();
    },
    showRecovery: show,
    hide
  };
}

function makeChromeIntentUrl(rawUrl) {
  const url = new URL(rawUrl);
  const scheme = url.protocol.replace(':', '') || 'https';
  const path = `${url.host}${url.pathname}${url.search}${url.hash}`;
  return `intent://${path}#Intent;scheme=${scheme};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(rawUrl)};end`;
}

export function isStandaloneDisplayMode() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
