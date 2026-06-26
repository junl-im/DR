import { isStandaloneDisplayMode } from './browserGuard.js';

function syncAppViewport() {
  const vv = window.visualViewport;
  const width = Math.round(vv?.width || window.innerWidth || document.documentElement.clientWidth || 390);
  const height = Math.round(vv?.height || window.innerHeight || document.documentElement.clientHeight || 844);
  document.documentElement.style.setProperty('--app-width', `${width}px`);
  document.documentElement.style.setProperty('--app-height', `${height}px`);
  document.body.dataset.orientation = width > height ? 'landscape' : 'portrait';
  return { width, height };
}

export async function requestGameFullscreen() {
  const root = document.documentElement;
  syncAppViewport();

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
    // Orientation lock is best-effort only. CSS and the portrait overlay keep layout stable.
  }

  syncAppViewport();
  return document.fullscreenElement || isStandaloneDisplayMode();
}

export function initFullscreenControls(button, statusCallback) {
  syncAppViewport();
  window.addEventListener('resize', syncAppViewport, { passive: true });
  window.visualViewport?.addEventListener('resize', syncAppViewport, { passive: true });

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
      statusCallback(active ? '전체화면 모드가 적용되었습니다.' : '브라우저 제한으로 전체화면이 거부되어도 세로 고정 레이아웃을 유지합니다.');
    }
  });

  document.addEventListener('fullscreenchange', updateLabel);
  updateLabel();
}
