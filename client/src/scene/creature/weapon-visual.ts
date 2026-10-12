import * as THREE from 'three';
import { attachToBone, detachProp, findBoneByName } from './attachment';
import { getWeaponAttachment } from './weapon-manifest';
import { loadGltfTemplate } from './mesh-character';

export interface WeaponVisualState {
  equippedItemId: number;
  prop: THREE.Object3D | null;
  loading: Promise<void> | null;
  /** Monotonic generation protects equip→unequip→equip of the same item. */
  requestVersion: number;
}

export function createWeaponVisualState(): WeaponVisualState {
  return { equippedItemId: 0, prop: null, loading: null, requestVersion: 0 };
}

/** Invalidate late asset requests when the owning avatar is replaced.
 * GLTF cached geometry/materials are not owned by the equipped prop.
 */
export function disposeWeaponVisual(state:WeaponVisualState):void {
  ++state.requestVersion;
  if(state.prop)detachProp(state.prop);
  state.prop=null;
  state.loading=null;
  state.equippedItemId=0;
}

const RIGHT_HAND_CANDIDATES = [
  'handslotr',    // KayKit name found in some runtime conversions
  'handslot.r',   // original GLB node name
  'handslot_r',   // GLTFLoader name sanitization variant
  'palm_R',       // System G6 / Qoma V3 humanoid rig
] as const;

export function findWeaponHand(root: THREE.Object3D, preferred: string): string | null {
  const names = [preferred, ...RIGHT_HAND_CANDIDATES];
  for (const name of new Set(names)) {
    if (findBoneByName(root, name)) return name;
  }
  return null;
}

export function syncWeaponVisual(
  root: THREE.Object3D,
  itemId: number,
  state: WeaponVisualState
): void {
  // One request per equipment transition. Do not load every animation frame.
  if (itemId === state.equippedItemId) return;
  const version = ++state.requestVersion;

  if (state.prop) {
    detachProp(state.prop);
    state.prop = null;
  }
  state.equippedItemId = itemId;
  // A previous request can still resolve; its version cannot commit.
  state.loading = null;

  const entry = itemId > 0 ? getWeaponAttachment(itemId) : null;
  if (!entry) return;

  const pending: Promise<void> = loadGltfTemplate(entry.model)
    .then((template) => {
      if (state.requestVersion !== version || state.equippedItemId !== itemId) return;
      const boneName = findWeaponHand(root, entry.bone);
      if (!boneName) {
        console.warn('weapon prop: compatible right-hand bone not found', itemId);
        return;
      }
      const prop = template.scene.clone(true);
      prop.name = `weapon-${itemId}`;
      if (!attachToBone(root, prop, boneName, entry.transform)) return;
      // The request can be superseded while work is scheduled.
      if (state.requestVersion !== version) {
        detachProp(prop);
        return;
      }
      state.prop = prop;
    })
    .catch((err) => {
      if (state.requestVersion === version) {
        console.warn(`weapon prop load failed for item ${itemId}:`, err);
      }
    })
    .finally(() => {
      if (state.requestVersion === version && state.loading === pending) {
        state.loading = null;
      }
    });
  state.loading = pending;
}
