const kakaoInAppPatterns = [
  /KAKAOTALK/i,
  /KakaoTalk/i,
  /KAKAO/i
];

const CONTINUE_KEY = 'dream-library-kakao-continue-inapp';
const TIP_KEY = 'dream-library-kakao-soft-tip-shown';

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
    if (!guard || !isKakao) return;
    setStatus(message);
    guard.classList.remove('hidden');
    guard.classList.add('soft-handoff');
    document.documentElement.classList.remove('handoff-browser');
    sessionStorage.setItem(TIP_KEY, 'yes');
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setStatus('주소를 복사했습니다. Chrome 또는 Safari 주소창에 붙여넣으면 같은 로비로 이어집니다.');
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
      setStatus('Chrome으로 이어서 여는 중입니다. 전환되지 않아도 카카오톡 안에서 게스트 플레이를 계속할 수 있습니다.');
      return true;
    }
    if (isIOS) {
      await copyUrl();
      show('iPhone에서는 자동 Safari 전환이 제한될 수 있어 주소 복사를 준비했습니다. 카카오톡 안에서도 로비와 게스트 플레이는 계속됩니다.');
      return true;
    }
    window.open(currentUrl, '_blank', 'noopener,noreferrer');
    setStatus('외부 브라우저 열기를 시도했습니다. 열리지 않으면 주소 복사를 사용하세요.');
    return true;
  };

  copyButton?.addEventListener('click', copyUrl);
  openButton?.addEventListener('click', openExternal);
  continueButton?.addEventListener('click', () => {
    sessionStorage.setItem(CONTINUE_KEY, 'yes');
    hide();
    setStatus('카카오톡 안에서 계속 진행합니다. 계정 로그인은 외부 브라우저가 더 안정적입니다.');
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
      return isKakao && sessionStorage.getItem(CONTINUE_KEY) !== 'yes';
    },
    async startHandoff() {
      if (!isKakao) return false;
      show('계정 저장과 결제형 브라우저 기능은 외부 브라우저가 더 안정적입니다. 게스트는 카카오톡 안에서도 계속할 수 있습니다.');
      return openExternal();
    },
    showRecovery(message = '카카오톡 안에서도 로비까지 바로 입장됩니다. 필요할 때만 외부 브라우저로 이어서 열 수 있습니다.') {
      show(message);
    },
    maybeShowSoftTip() {
      if (isKakao && sessionStorage.getItem(TIP_KEY) !== 'yes') {
        show('카카오톡 안에서도 로비로 바로 들어갑니다. Google/Email 저장이 필요할 때만 외부 브라우저를 사용하세요.');
      }
    },
    continueInApp() {
      sessionStorage.setItem(CONTINUE_KEY, 'yes');
      hide();
    },
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
