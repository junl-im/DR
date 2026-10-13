import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  DEATH_DISSOLVE_DURATION_MS,
  attachDeathDissolve,
  restoreOpacity,
  sampleDissolveOpacity,
  tickDissolve,
} from './death-dissolve-vfx';

describe('death-dissolve-vfx', () => {
  it('fades opacity to ~0.5 at 600ms', () => {
    const root = new THREE.Group();
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    root.add(mesh);
    const handle = attachDeathDissolve(root, 0);
    const opacity = sampleDissolveOpacity(handle, 600);
    expect(opacity).toBeGreaterThanOrEqual(0.4);
    expect(opacity).toBeLessThanOrEqual(0.6);
  });

  it('completes dissolve and restores opacity for reuse', () => {
    const root = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    root.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat));
    const handle = attachDeathDissolve(root, 0);
    expect(tickDissolve(handle, DEATH_DISSOLVE_DURATION_MS)).toBe(true);
    restoreOpacity(handle);
    expect(mat.opacity).toBe(1);
  });
});

describe('shared GLB material isolation', () => {
  it('keeps living siblings and a new spawn opaque during overlapping deaths', () => {
    const template = new THREE.MeshLambertMaterial();
    const make = () => {const root=new THREE.Group();root.add(new THREE.Mesh(new THREE.BoxGeometry(),template));return root;};
    const first=make(), living=make(), second=make();
    const one=attachDeathDissolve(first,0);tickDissolve(one,600);
    const two=attachDeathDissolve(second,600);tickDissolve(two,900);
    const spawned=make();
    expect(template.opacity).toBe(1);expect(template.transparent).toBe(false);
    for(const root of [living,spawned])expect((root.children[0] as THREE.Mesh).material).toBe(template);
    expect(one.materials[0].mat.opacity).toBeCloseTo(.5);
    expect(two.materials[0].mat.opacity).toBeCloseTo(.75);
    restoreOpacity(one);restoreOpacity(two);
    expect(template.opacity).toBe(1);
  });
  it('deduplicates temporary material clones and restores exact arrays/flags', () => {
    const source=new THREE.MeshBasicMaterial({transparent:true,opacity:.8,depthWrite:false});
    const original=[source,source],root=new THREE.Group();
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(),original);root.add(mesh);
    const handle=attachDeathDissolve(root,0);expect(handle.materials).toHaveLength(1);
    let disposed=0;handle.materials[0].mat.addEventListener('dispose',()=>disposed++);
    tickDissolve(handle,600);restoreOpacity(handle);restoreOpacity(handle);
    expect(mesh.material).toBe(original);expect(source.opacity).toBe(.8);
    expect(source.transparent).toBe(true);expect(source.depthWrite).toBe(false);expect(disposed).toBe(1);
  });
});
