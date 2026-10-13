import { clampCameraZoom } from './camera-wheel-zoom';

/** Pinch-out brings the camera closer; pinch-in moves it away. */
export function nextPinchZoom(current: number, before: number, after: number): number {
  if (!Number.isFinite(before) || !Number.isFinite(after) || before <= 0 || after <= 0) {
    return clampCameraZoom(current);
  }
  return clampCameraZoom(current * before / after);
}

type Point = { x: number; y: number };

/** Tracks only touches that began on the world canvas, never HUD touches. */
export class PinchZoomGesture {
  private readonly fingers = new Map<number, Point>();
  private distance: number | null = null;
  private suppressTap = false;

  pointerDown(id: number, x: number, y: number): boolean {
    this.fingers.set(id, { x, y });
    this.distance = this.twoFingerDistance();
    if (this.fingers.size >= 2) this.suppressTap = true;
    return this.suppressTap;
  }

  pointerMove(id: number, x: number, y: number, currentZoom: number): number | null {
    if (!this.fingers.has(id)) return null;
    this.fingers.set(id, { x, y });
    const now = this.twoFingerDistance();
    const before = this.distance;
    this.distance = now;
    if (!this.suppressTap || now === null || before === null || now < 8 || before < 8) {
      return null;
    }
    return nextPinchZoom(currentZoom, before, now);
  }

  /** Returns true when this release must not click or move the character. */
  pointerUp(id: number): boolean {
    const consumed = this.suppressTap;
    this.fingers.delete(id);
    this.distance = this.twoFingerDistance();
    if (this.fingers.size === 0) this.suppressTap = false;
    return consumed;
  }

  private twoFingerDistance(): number | null {
    if (this.fingers.size !== 2) return null;
    const [a, b] = [...this.fingers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
}
