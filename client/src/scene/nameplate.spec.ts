import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createNameplate } from './nameplate';

describe('createNameplate', () => {
  it('creates a camera-facing sprite positioned above the head', () => {
    const plate = createNameplate('Hero');
    expect(plate.sprite).toBeInstanceOf(THREE.Sprite);
    expect(plate.sprite.name).toBe('nameplate');
    expect(plate.sprite.position.y).toBeGreaterThan(1.5);
    // Wider than tall so the label reads horizontally.
    expect(plate.sprite.scale.x).toBeGreaterThan(plate.sprite.scale.y);
  });

  it('shows names larger and sharper than the original tiny 256x64 sprite',()=>{
    const plate=createNameplate('이름이 긴 모험가');
    const material=plate.sprite.material as THREE.SpriteMaterial;
    const canvas=(material.map as THREE.CanvasTexture).image as HTMLCanvasElement;
    expect(canvas.width).toBeGreaterThanOrEqual(512);
    expect(canvas.height).toBeGreaterThanOrEqual(128);
    expect(plate.sprite.scale.y).toBeGreaterThanOrEqual(.8);
    expect(plate.sprite.position.y).toBeGreaterThanOrEqual(2.3);
    plate.dispose();
  });

  it('renders above other geometry (no depth clipping by the body mesh)', () => {
    const plate = createNameplate('Hero');
    const material = plate.sprite.material as THREE.SpriteMaterial;
    expect(material.depthTest).toBe(false);
    expect(material.transparent).toBe(true);
  });

  it('setText and dispose do not throw', () => {
    const plate = createNameplate('Hero');
    expect(() => plate.setText('A Much Longer Name')).not.toThrow();
    expect(() => plate.dispose()).not.toThrow();
  });
});
