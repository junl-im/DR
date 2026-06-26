let deferredInstallPrompt = null;

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  const baseUrl = import.meta.env.BASE_URL || '/';
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${baseUrl}sw.js`).catch(() => {
      // The game still works without offline cache.
    });
  });
}

export function initInstallPrompt(button, statusCallback) {
  if (!button) return;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    button.classList.remove('hidden');
  });

  button.addEventListener('click', async () => {
    if (!deferredInstallPrompt) {
      statusCallback?.('메뉴에서 홈 화면에 추가를 선택하면 앱처럼 실행됩니다.');
      return;
    }

    deferredInstallPrompt.prompt();
    const result = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    button.classList.add('hidden');

    if (result.outcome === 'accepted') {
      statusCallback?.('설치가 완료되면 홈 화면 아이콘으로 실행하세요.');
    } else {
      statusCallback?.('설치를 취소했습니다. 게임은 브라우저에서도 계속 진행할 수 있습니다.');
    }
  });
}
