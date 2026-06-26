const blockedInAppPatterns = [
  /KAKAOTALK/i,
  /KakaoTalk/i,
  /KAKAO/i
];

export function initBrowserGuard() {
  const userAgent = navigator.userAgent || '';
  const isBlocked = blockedInAppPatterns.some((pattern) => pattern.test(userAgent));
  const guard = document.querySelector('#browser-guard');
  const copyButton = document.querySelector('#copy-url-button');
  const openButton = document.querySelector('#open-external-button');
  const status = document.querySelector('#guard-status');

  if (!guard || !copyButton || !openButton || !status) {
    return { blocked: false };
  }

  const currentUrl = window.location.href;

  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      status.textContent = '주소를 복사했습니다. Chrome 또는 Safari에서 붙여넣어 주세요.';
    } catch {
      status.textContent = currentUrl;
    }
  });

  openButton.addEventListener('click', () => {
    window.open(currentUrl, '_blank', 'noopener,noreferrer');
    status.textContent = '새 창이 열리지 않으면 주소 복사를 사용하세요.';
  });

  if (!isBlocked) {
    guard.classList.add('hidden');
    document.documentElement.classList.remove('blocked-browser');
    return { blocked: false };
  }

  guard.classList.remove('hidden');
  document.documentElement.classList.add('blocked-browser');
  return { blocked: true };
}

export function isStandaloneDisplayMode() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
