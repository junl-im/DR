import * as THREE from 'three';
import { ACTION_DURATION_MS, EntityAction } from '@nj/game-core';

export const DEATH_DISSOLVE_DURATION_MS = ACTION_DURATION_MS[EntityAction.Die];
const SINK_Y = 0.15;

export interface DissolveHandle {
  root: THREE.Object3D;
  spawnedAtMs: number;
  bindings: Array<{ mesh: THREE.Mesh; original: THREE.Material | THREE.Material[] }>;
  released?: boolean;
  materials: Array<{ mat: THREE.Material; originalOpacity: number }>;
}

/** SkeletonUtils clones share template materials. Only the dying root may fade. */
export function attachDeathDissolve(root: THREE.Object3D, nowMs: number): DissolveHandle {
  const clones = new Map<THREE.Material, THREE.Material>();
  const bindings: DissolveHandle['bindings'] = [];
  root.traverse(obj => {
    if (!(obj instanceof THREE.Mesh)) return;
    const original = obj.material;
    const copy = (source: THREE.Material) => {
      let clone = clones.get(source);
      if (!clone) {
        clone = source.clone();
        clone.transparent = true;
        clone.needsUpdate = true;
        clones.set(source, clone);
      }
      return clone;
    };
    obj.material = Array.isArray(original) ? original.map(copy) : copy(original);
    bindings.push({mesh:obj, original});
  });
  return {root, spawnedAtMs:nowMs, bindings,
    materials:[...clones.values()].map(mat => ({mat, originalOpacity:mat.opacity}))};
}

export function tickDissolve(handle: DissolveHandle, nowMs: number): boolean {
  const elapsed = nowMs - handle.spawnedAtMs;
  const t = Math.min(1, elapsed / DEATH_DISSOLVE_DURATION_MS);
  const opacity = 1 - t;
  for (const { mat, originalOpacity } of handle.materials) {
    (mat as THREE.MeshLambertMaterial).opacity = originalOpacity * opacity;
  }
  if (handle.root.userData.dissolveStartY === undefined) {
    handle.root.userData.dissolveStartY = handle.root.position.y;
  }
  const baseY = handle.root.userData.dissolveStartY as number;
  handle.root.position.y = baseY - SINK_Y * t;
  return t >= 1;
}

export function restoreOpacity(handle: DissolveHandle): void {
  if (handle.released) return;
  handle.released = true;
  for (const {mesh, original} of handle.bindings) mesh.material = original;
  for (const {mat} of handle.materials) mat.dispose();
  const startY = handle.root.userData.dissolveStartY as number | undefined;
  if (startY !== undefined) handle.root.position.y = startY;
  delete handle.root.userData.dissolveStartY;
}

export function sampleDissolveOpacity(handle: DissolveHandle, nowMs: number): number {
  const t = Math.min(1, (nowMs - handle.spawnedAtMs) / DEATH_DISSOLVE_DURATION_MS);
  return 1 - t;
}
