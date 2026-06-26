export function hapticTap(pattern: number | number[] = 12) {
  if (!('vibrate' in navigator)) return;
  try { navigator.vibrate(pattern); } catch { /* ignore unsupported haptics */ }
}

export const HAPTIC = {
  tap: () => hapticTap(10),
  select: () => hapticTap(14),
  match: () => hapticTap([12, 24, 18]),
  combo: () => hapticTap([18, 22, 28]),
  warning: () => hapticTap([30, 28, 30])
};
