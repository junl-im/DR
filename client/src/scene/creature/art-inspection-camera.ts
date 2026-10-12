import * as THREE from 'three';
import { findBoneByName } from './attachment';

export type InspectionAngle = 'three-quarter' | 'front' | 'side' | 'back';
export type InspectionFocus = 'full' | 'head' | 'hands' | 'feet';

export const INSPECTION_ANGLES:readonly InspectionAngle[] =
  ['three-quarter','front','side','back'];
export const INSPECTION_FOCI:readonly InspectionFocus[] =
  ['full','head','hands','feet'];

export interface InspectionFraming {
  position: THREE.Vector3;
  target: THREE.Vector3;
  near: number;
  far: number;
}

/** Stable world-space framing. Only repositions the preview camera; no
 * source geometry, animation, collision, inventory or game camera changes.
 * Recompute after a pose change when examining a moving hand.
 */
export function frameInspectionCamera(
  root: THREE.Object3D,
  angle: InspectionAngle,
  focus: InspectionFocus,
  zoom = 1
): InspectionFraming {
  if (!INSPECTION_ANGLES.includes(angle) || !INSPECTION_FOCI.includes(focus) ||
      !Number.isFinite(zoom) || zoom < .5 || zoom > 3) {
    throw new Error('Invalid art inspection camera settings');
  }
  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(root);
  if (bounds.isEmpty()) throw new Error('Art preview character has no visible bounds');
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const height = Math.max(size.y, .25);
  const target = center.clone();
  if (focus === 'head') {
    target.y = bounds.min.y + height*.86;
  } else if (focus === 'feet') {
    target.y = bounds.min.y + height*.15;
  } else if (focus === 'hands') {
    const bone = findBoneByName(root,'palm_R') ??
      findBoneByName(root,'handslotr') ??
      findBoneByName(root,'handslot.r');
    if (bone) target.copy(bone.getWorldPosition(new THREE.Vector3()));
    else target.y = bounds.min.y + height*.58;
  } else {
    target.y = bounds.min.y + height*.53;
  }
  // A separate part close-up uses a near plane small enough that a blade
  // crossing the view never disappears because of clipping.
  const distance = (focus === 'full' ? 2.55 : .82)*height/zoom;
  const offsets:Record<InspectionAngle,THREE.Vector3> = {
    'three-quarter':new THREE.Vector3(.38,.035,1).normalize(),
    front:new THREE.Vector3(0,.045,1).normalize(),
    side:new THREE.Vector3(1,.045,0).normalize(),
    back:new THREE.Vector3(0,.045,-1).normalize(),
  };
  const position = target.clone().addScaledVector(offsets[angle],distance);
  return {position,target,near:.01,far:Math.max(25,height*16)};
}

export function applyInspectionCamera(
  camera:THREE.PerspectiveCamera,
  framing:InspectionFraming
):void {
  camera.position.copy(framing.position);
  camera.near=framing.near;camera.far=framing.far;
  camera.lookAt(framing.target);
  camera.updateProjectionMatrix();
}
