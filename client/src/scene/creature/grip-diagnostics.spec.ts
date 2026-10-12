import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { sampleWeaponGrip, SQUIRES_SWORD_TIP_Y } from './grip-diagnostics';
import { attachToBone } from './attachment';

function fixture() {
  const root = new THREE.Group();
  const bone = new THREE.Bone();
  bone.name = 'palm_R';
  bone.position.set(.4, 1.2, -.2);
  const skinned = new THREE.SkinnedMesh(new THREE.BoxGeometry(.3, .7, .2), new THREE.MeshBasicMaterial());
  skinned.bind(new THREE.Skeleton([bone]));
  root.add(bone, skinned);
  return {root, bone};
}

describe('V3 grip pose diagnostics', () => {
  it('measures the actual hand origin and Y-up sword at a frozen frame', () => {
    const {root, bone} = fixture();
    const sword = new THREE.Group();
    expect(attachToBone(root,sword,'palm_R',{position:[0,0,0],rotation:[0,0,0],scale:1})).toBe(true);
    const idle=sampleWeaponGrip(root,sword,'palm_R')!;
    expect(idle.hand).toEqual(idle.hilt);
    expect(idle.bladeLength).toBeCloseTo(SQUIRES_SWORD_TIP_Y,5);
    bone.rotation.z=Math.PI/2;
    const attack=sampleWeaponGrip(root,sword,'palm_R')!;
    expect(attack.gripGap).toBeCloseTo(0,5);
    expect(attack.tip[0]).not.toBeCloseTo(idle.tip[0],3);
    expect(attack.bladeLength).toBeCloseTo(idle.bladeLength,5);
  });

  it('reports a shifted local grip in world units and supports different sword scales',()=>{
    const {root}=fixture();
    const sword=new THREE.Group();
    attachToBone(root,sword,'palm_R',{position:[.12,-.08,.03],rotation:[0,0,0],scale:1.4});
    const sample=sampleWeaponGrip(root,sword,'palm_R')!;
    expect(sample.gripGap).toBeCloseTo(Math.hypot(.12,-.08,.03),5);
    expect(sample.bladeLength).toBeCloseTo(SQUIRES_SWORD_TIP_Y*1.4,5);
  });

  it('rejects unmounted, missing-bone and nonfinite diagnostics',()=>{
    const {root}=fixture();
    expect(sampleWeaponGrip(root,null,'palm_R')).toBeNull();
    expect(sampleWeaponGrip(root,new THREE.Group(),'palm_R')).toBeNull();
    const sword=new THREE.Group();
    root.add(sword);
    expect(sampleWeaponGrip(root,sword,'nonexistent')).toBeNull();
    sword.position.x=Number.NaN;
    expect(sampleWeaponGrip(root,sword,'palm_R')).toBeNull();
  });
});
