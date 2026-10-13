import { describe, expect, it } from 'vitest';
import { CAMERA_ZOOM_MAX, CAMERA_ZOOM_MIN } from './camera-wheel-zoom';
import { nextPinchZoom, PinchZoomGesture } from './camera-pinch-zoom';

describe('two-finger world zoom', () => {
  it('zooms in when fingers spread and out when fingers come together', () => {
    expect(nextPinchZoom(1, 100, 125)).toBeCloseTo(.8, 5);
    expect(nextPinchZoom(1, 100, 80)).toBeCloseTo(1.25, 5);
  });

  it('uses the existing conservative camera limits for wheel and touch', () => {
    expect(nextPinchZoom(1, 100, 500)).toBe(CAMERA_ZOOM_MIN);
    expect(nextPinchZoom(1, 500, 100)).toBe(CAMERA_ZOOM_MAX);
    expect(nextPinchZoom(1, 0, 40)).toBe(1);
    expect(nextPinchZoom(1, Number.NaN, 40)).toBe(1);
  });

  it('never interprets one-finger movement as camera zoom', () => {
    const gesture = new PinchZoomGesture();
    expect(gesture.pointerDown(11, 100, 120)).toBe(false);
    expect(gesture.pointerMove(11, 130, 160, 1)).toBeNull();
    expect(gesture.pointerUp(11)).toBe(false);
  });

  it('suppresses every click in a pinch, including after one finger lifts', () => {
    const gesture = new PinchZoomGesture();
    gesture.pointerDown(1, 100, 100);
    expect(gesture.pointerDown(2, 200, 100)).toBe(true);
    expect(gesture.pointerMove(2, 225, 100, 1)).toBeCloseTo(CAMERA_ZOOM_MIN);
    expect(gesture.pointerUp(1)).toBe(true);
    expect(gesture.pointerMove(2, 220, 100, 1)).toBeNull();
    expect(gesture.pointerUp(2)).toBe(true);
    expect(gesture.pointerDown(3, 50, 50)).toBe(false);
    expect(gesture.pointerUp(3)).toBe(false);
  });

  it('does not jump after a third finger is placed and removed', () => {
    const gesture = new PinchZoomGesture();
    gesture.pointerDown(1, 0, 0);
    gesture.pointerDown(2, 100, 0);
    gesture.pointerDown(3, 50, 50);
    expect(gesture.pointerMove(2, 105, 0, 1)).toBeNull();
    expect(gesture.pointerUp(3)).toBe(true);
    expect(gesture.pointerMove(2, 110, 0, 1)).toBeCloseTo(105 / 110);
  });
});
