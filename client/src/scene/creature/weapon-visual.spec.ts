import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';

vi.mock('./mesh-character', () => ({
  loadGltfTemplate: vi.fn(),
}));

import { loadGltfTemplate } from './mesh-character';
import { createWeaponVisualState, syncWeaponVisual } from './weapon-visual';

function buildCharacter(handName: string): { root: THREE.Group; hand: THREE.Bone } {
  const root = new THREE.Group();
  const armature = new THREE.Bone();
  armature.name = 'root';
  const hand = new THREE.Bone();
  hand.name = handName;
  armature.add(hand);
  const skinned = new THREE.SkinnedMesh(
    new THREE.BoxGeometry(0.2, 0.5, 0.2),
    new THREE.MeshBasicMaterial()
  );
  skinned.bind(new THREE.Skeleton([armature, hand]));
  root.add(armature, skinned);
  return { root, hand };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(loadGltfTemplate).mockImplementation(async () => {
    const scene = new THREE.Group();
    scene.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.1)));
    return { scene, animations: [] };
  });
});

describe('starter sword visual rig attachment', () => {
  it.each(['handslotr', 'palm_R'])('attaches to %s and detaches on unequip', async (bone) => {
    const { root, hand } = buildCharacter(bone);
    const state = createWeaponVisualState();
    syncWeaponVisual(root, 2369, state);
    const loading = state.loading;
    expect(loading).not.toBeNull();
    await loading;
    expect(state.prop?.parent).toBe(hand);
    expect(state.prop?.name).toBe('weapon-2369');
    syncWeaponVisual(root, 0, state);
    expect(state.prop).toBeNull();
    expect(hand.children.some((child) => child.name === 'weapon-2369')).toBe(false);
  });

  it('does not reattach a stale sword when unequipped before loading finishes', async () => {
    let finish!: (value: { scene: THREE.Group; animations: THREE.AnimationClip[] }) => void;
    vi.mocked(loadGltfTemplate).mockImplementationOnce(
      () => new Promise((resolve) => { finish = resolve; })
    );
    const { root } = buildCharacter('palm_R');
    const state = createWeaponVisualState();
    syncWeaponVisual(root, 2369, state);
    const inFlight = state.loading;
    syncWeaponVisual(root, 0, state);
    finish({ scene: new THREE.Group(), animations: [] });
    await inFlight;
    expect(state.equippedItemId).toBe(0);
    expect(state.prop).toBeNull();
  });

  it('does not endlessly reload an incompatible skeleton every frame', async () => {
    const root = new THREE.Group();
    const state = createWeaponVisualState();
    syncWeaponVisual(root, 2369, state);
    await state.loading;
    expect(state.prop).toBeNull();
    syncWeaponVisual(root, 2369, state);
    expect(loadGltfTemplate).toHaveBeenCalledTimes(1);
  });
});
