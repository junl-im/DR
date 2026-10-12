import * as THREE from 'three';
import { findBoneByName } from './attachment';

/** Local-to-world diagnostics only. Never adjusts equipped items or save data.
 * SquiresSword.glb is Y-up with its tip at approximately local Y = 0.924.
 */
export const SQUIRES_SWORD_TIP_Y = 0.924;

export interface GripSample {
  hand: THREE.Vector3Tuple;
  hilt: THREE.Vector3Tuple;
  tip: THREE.Vector3Tuple;
  gripGap: number;
  bladeLength: number;
}

export function sampleWeaponGrip(
  character: THREE.Object3D,
  prop: THREE.Object3D | null,
  handName: string
): GripSample | null {
  if (!prop) return null;
  const bone = findBoneByName(character, handName);
  if (!bone || !bone.getWorldPosition || !prop.parent) return null;
  character.updateMatrixWorld(true);
  const hand = bone.getWorldPosition(new THREE.Vector3());
  const hilt = prop.localToWorld(new THREE.Vector3(0, 0, 0));
  const tip = prop.localToWorld(new THREE.Vector3(0, SQUIRES_SWORD_TIP_Y, 0));
  if (![...hand.toArray(), ...hilt.toArray(), ...tip.toArray()].every(Number.isFinite)) return null;
  return {
    hand: hand.toArray(),
    hilt: hilt.toArray(),
    tip: tip.toArray(),
    gripGap: hand.distanceTo(hilt),
    bladeLength: hilt.distanceTo(tip),
  };
}
