import * as THREE from 'three';
import { attachToBone, detachProp } from './attachment';
import { getWeaponAttachment } from './weapon-manifest';
import { loadGltfTemplate } from './mesh-character';

export interface WeaponVisualState {
  equippedItemId: number;
  prop: THREE.Object3D | null;
  loading: Promise<void> | null;
}

export function createWeaponVisualState(): WeaponVisualState {
  return { equippedItemId: 0, prop: null, loading: null };
}

export function syncWeaponVisual(
  root: THREE.Object3D,
  itemId: number,
  state: WeaponVisualState
): void {
  if (itemId === state.equippedItemId && (state.prop !== null || state.loading !== null || itemId === 0)) return;

  if (state.prop) {
    detachProp(state.prop);
    state.prop = null;
  }
  state.equippedItemId = itemId;

  const entry = itemId > 0 ? getWeaponAttachment(itemId) : null;
  if (!entry) return;

  const pending = loadGltfTemplate(entry.model)
    .then((template) => {
      if (state.equippedItemId !== itemId) return;
      const prop = template.scene.clone(true);
      prop.name = `weapon-${itemId}`;
      // The original KayKit rig and the licensed V3/G6 rig use different
      // hand nodes. Keep the existing KayKit mount and fall back to G6 palm_R.
      const attached = attachToBone(root, prop, entry.bone, entry.transform) ||
        attachToBone(root, prop, 'palm_R', entry.transform);
      if (!attached) {
        detachProp(prop);
        return;
      }
      state.prop = prop;
    })
    .catch((err) => {
      console.warn(`weapon prop load failed for item ${itemId}:`, err);
    })
    .finally(() => {
      if (state.loading === pending) state.loading = null;
    });
  state.loading = pending;
}
