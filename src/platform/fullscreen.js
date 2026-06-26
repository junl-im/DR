import { isStandaloneDisplayMode } from './browserGuard.js';
import { applyPortraitFrame } from './viewportFrame.js';

function syncAppViewport() {
  return applyPortraitFrame();
}

export async function requestGameFullscreen() {
  const root = document.documentElement;
  syncAppViewport();

  try {
    if (!document.fullscreenElement && root.requestFullscreen) {
      await root.requestFullscreen({ navigationUI: 'hide' });
    }
  } catch {
    // Some in-app browsers reject fullscreen. The virtual portrait frame keeps the UI stable.
  }

  try {
    if (screen.orientation?.lock) {
      await screen.orientation.lock('portrait');
    }
  } catch {
    // Best effort only. Layout does not depend on this succeeding.
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
      statusCallback(active ? '게임 화면을 맞췄습니다.' : '화면 크기에 맞춰 게임 프레임을 유지합니다.');
    }
  });

  document.addEventListener('fullscreenchange', updateLabel);
  updateLabel();
}
