export type QualityTier = 'low' | 'medium' | 'high';

export type DeviceProfile = {
  tier: QualityTier;
  pixelRatio: number;
  particleScale: number;
  motionScale: number;
  maxBoardTile: number;
  reason: string;
};

const STORAGE_KEY = 'dream-library-quality-tier';

export function detectDeviceProfile(): DeviceProfile {
  const saved = localStorage.getItem(STORAGE_KEY) as QualityTier | null;
  if (saved === 'low' || saved === 'medium' || saved === 'high') return profileFromTier(saved, '사용자 설정');

  const memory = Number((navigator as any).deviceMemory || 4);
  const cores = Number(navigator.hardwareConcurrency || 4);
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const smallViewport = Math.min(window.innerWidth, window.innerHeight) <= 380;

  if (reducedMotion || memory <= 2 || cores <= 3) return profileFromTier('low', reducedMotion ? '감소된 모션 설정' : '저사양 기기 보호');
  if (memory <= 4 || cores <= 5 || smallViewport) return profileFromTier('medium', smallViewport ? '소형 화면 최적화' : '중간 사양 최적화');
  return profileFromTier('high', '고품질 렌더링');
}

export function saveQualityTier(tier: QualityTier) {
  localStorage.setItem(STORAGE_KEY, tier);
}

export function nextQualityTier(current: QualityTier): QualityTier {
  if (current === 'high') return 'medium';
  if (current === 'medium') return 'low';
  return 'high';
}

function profileFromTier(tier: QualityTier, reason: string): DeviceProfile {
  const dpr = Math.min(window.devicePixelRatio || 1, tier === 'high' ? 2 : tier === 'medium' ? 1.5 : 1.15);
  return {
    tier,
    pixelRatio: dpr,
    particleScale: tier === 'high' ? 1 : tier === 'medium' ? 0.72 : 0.42,
    motionScale: tier === 'high' ? 1 : tier === 'medium' ? 0.78 : 0.48,
    maxBoardTile: tier === 'high' ? 72 : tier === 'medium' ? 66 : 58,
    reason
  };
}
