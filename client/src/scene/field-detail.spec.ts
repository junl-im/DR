import {describe,expect,it} from 'vitest';
import * as THREE from 'three';
import {buildFieldGroundCover} from './field-detail';
describe('deterministic collision-free field foliage',()=>{
  it('uses two draw-call instances with fixed counts and no interactive raycasts',()=>{
    const scene=new THREE.Scene();
    const root=buildFieldGroundCover(scene);
    expect(buildFieldGroundCover(scene)).toBe(root);
    const grass=root.getObjectByName('field-grass-tufts') as THREE.InstancedMesh;
    const rocks=root.getObjectByName('field-mossy-stones') as THREE.InstancedMesh;
    expect(grass.count).toBe(120);
    expect(rocks.count).toBe(48);
    expect(root.children).toHaveLength(2);
    const raycaster=new THREE.Raycaster();
    expect(raycaster.intersectObject(grass)).toEqual([]);
    expect(raycaster.intersectObject(rocks)).toEqual([]);
    expect(grass.castShadow).toBe(false);
    expect(rocks.castShadow).toBe(false);
    expect(grass.userData['decorative']).toBe(true);
  });
  it('repeats positions for each fresh scene with the same seed',()=>{
    const a=new THREE.Scene(),b=new THREE.Scene();
    const first=buildFieldGroundCover(a).getObjectByName('field-grass-tufts') as THREE.InstancedMesh;
    const other=buildFieldGroundCover(b).getObjectByName('field-grass-tufts') as THREE.InstancedMesh;
    const mat1=new THREE.Matrix4(),mat2=new THREE.Matrix4();
    for(const i of [0,24,75,119]){
      first.getMatrixAt(i,mat1);other.getMatrixAt(i,mat2);
      expect(mat1.elements).toEqual(mat2.elements);
    }
  });
});
