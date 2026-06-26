import { isStandaloneDisplayMode } from './browserGuard.js';

export async function requestGameFullscreen() {
  const root = document.documentElement;

  try {
    if (!document.fullscreenElement && root.requestFullscreen) {
      await root.requestFullscreen({ navigationUI: 'hide' });
    }
  } catch {
    // iOS Safari and some in-app browsers do not allow requestFullscreen.
  }

  try {
    if (screen.orientation?.lock) {
      await screen.orientation.lock('portrait');
    }
  } catch {
    // Orientation lock is best-effort only.
  }

  return document.fullscreenElement || isStandaloneDisplayMode();
}

export function initFullscreenControls(button, statusCallback) {
  if (!button) return;

  const updateLabel = () => {
    const active = Boolean(document.fullscreenElement) || isStandaloneDisplayMode();
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  };

  button.addEventListener('click', async () => {
    const active = await requestGameFullscreen();
    updateLabel();
    if (statusCallback) {
      statusCallback(active ? '전체화면 모드가 적용되었습니다.' : '브라우저 제한으로 전체화면이 거부되었습니다. 홈 화면 추가 실행을 권장합니다.');
    }
  });

  document.addEventListener('fullscreenchange', updateLabel);
  updateLabel();
}
