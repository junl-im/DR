import { isStandaloneDisplayMode } from './browserGuard.js';
import { applyPortraitFrame } from './viewportFrame.js';

const KAKAO_PATTERNS = [/KAKAOTALK/i, /KakaoTalk/i, /KAKAO/i];

function isKakaoInApp() {
  return KAKAO_PATTERNS.some((pattern) => pattern.test(navigator.userAgent || ''));
}

export function syncGameViewport(options = {}) {
  return applyPortraitFrame(options);
}

export async function requestGameFullscreen(options = {}) {
  const root = document.documentElement;
  const hardRequest = options.hard === true && !isKakaoInApp();
  syncGameViewport({ reason: options.reason || 'manual' });

  if (hardRequest) {
    try {
      if (!document.fullscreenElement && root.requestFullscreen) {
        await root.requestFullscreen({ navigationUI: 'hide' });
      }
    } catch {
      // Fullscreen is optional. The virtual portrait frame is the layout source of truth.
    }

    try {
      if (screen.orientation?.lock) {
        await screen.orientation.lock('portrait');
      }
    } catch {
      // Orientation lock is optional and is intentionally skipped in Kakao in-app browsers.
    }
  }

  syncGameViewport({ reason: options.reason || 'manual-after' });
  return document.fullscreenElement || isStandaloneDisplayMode();
}

export function initFullscreenControls(button, statusCallback) {
  syncGameViewport({ reason: 'init' });
  window.addEventListener('resize', () => syncGameViewport({ reason: 'resize' }), { passive: true });
  window.visualViewport?.addEventListener('resize', () => syncGameViewport({ reason: 'visual-resize' }), { passive: true });

  if (!button) return;

  const updateLabel = () => {
    const active = Boolean(document.fullscreenElement) || isStandaloneDisplayMode();
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  };

  button.addEventListener('click', async () => {
    const active = await requestGameFullscreen({ hard: true, reason: 'settings-button' });
    updateLabel();
    if (statusCallback) {
      statusCallback(active ? '화면 보정을 적용했습니다.' : '화면 보정 상태를 유지합니다.');
    }
  });

  document.addEventListener('fullscreenchange', () => {
    syncGameViewport({ reason: 'fullscreenchange' });
    updateLabel();
  });
  updateLabel();
}
