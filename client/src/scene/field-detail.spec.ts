import {describe,expect,it,vi} from 'vitest';
import * as THREE from 'three';
import {buildFieldGroundCover,disposeFieldGroundCover,FIELD_COVER_COUNTS,FIELD_COVER_NAME} from './field-detail';
import {DUNGEON_ARENA} from '../local/first-dungeon';

function instancePosition(mesh:THREE.InstancedMesh,index:number):THREE.Vector3 {
  const matrix=new THREE.Matrix4();
  mesh.getMatrixAt(index,matrix);
  return new THREE.Vector3().setFromMatrixPosition(matrix);
}

describe('seeded and collision-free field and village edge dressing',()=>{
  it('adds three draw-call-equivalent instanced decorations to scene only once',()=>{
    const scene=new THREE.Scene();
    const root=buildFieldGroundCover(scene);
    expect(root.name).toBe(FIELD_COVER_NAME);
    expect(scene.getObjectByName(FIELD_COVER_NAME)).toBe(root);
    expect(buildFieldGroundCover(scene)).toBe(root);
    const grass=root.getObjectByName('field-grass-tufts') as THREE.InstancedMesh;
    const rocks=root.getObjectByName('field-mossy-stones') as THREE.InstancedMesh;
    const flowers=root.getObjectByName('field-wildflowers') as THREE.InstancedMesh;
    expect(root.children).toHaveLength(3);
    expect([grass.count,rocks.count,flowers.count]).toEqual([
      FIELD_COVER_COUNTS.grass,FIELD_COVER_COUNTS.rock,FIELD_COVER_COUNTS.flower,
    ]);
    const raycaster=new THREE.Raycaster();
    for(const mesh of [grass,rocks,flowers]){
      expect(mesh).toBeInstanceOf(THREE.InstancedMesh);
      expect(raycaster.intersectObject(mesh)).toEqual([]);
      expect(mesh.castShadow).toBe(false);
      expect(mesh.receiveShadow).toBe(false);
      expect(mesh.userData['decorative']).toBe(true);
      expect(mesh.instanceColor).not.toBeNull();
      expect(mesh.boundingSphere).not.toBeNull();
    }
  });

  it('repeats transforms and vertex colors in fresh scenes with no RNG drift',()=>{
    const a=buildFieldGroundCover(new THREE.Scene());
    const b=buildFieldGroundCover(new THREE.Scene());
    for(const name of ['field-grass-tufts','field-mossy-stones','field-wildflowers']){
      const m1=a.getObjectByName(name) as THREE.InstancedMesh;
      const m2=b.getObjectByName(name) as THREE.InstancedMesh;
      const mat1=new THREE.Matrix4(),mat2=new THREE.Matrix4();
      for(const i of [0,Math.floor(m1.count/2),m1.count-1]){
        m1.getMatrixAt(i,mat1);m2.getMatrixAt(i,mat2);
        expect(mat1.elements).toEqual(mat2.elements);
        expect(m1.instanceColor!.getX(i)).toBeCloseTo(m2.instanceColor!.getX(i),6);
      }
    }
  });

  it('dresses the village perimeter, keeping field props outside dungeon and village core',()=>{
    const root=buildFieldGroundCover(new THREE.Scene());
    const rocks=root.getObjectByName('field-mossy-stones') as THREE.InstancedMesh;
    const grass=root.getObjectByName('field-grass-tufts') as THREE.InstancedMesh;
    const flowers=root.getObjectByName('field-wildflowers') as THREE.InstancedMesh;
    for(const [mesh,nearCount] of [[grass,160],[rocks,12],[flowers,72]] as const){
      for(let i=0;i<mesh.count;i++){
        const p=instancePosition(mesh,i),rad=Math.hypot(p.x,p.z);
        expect(rad).toBeGreaterThanOrEqual(24.99);
        if(i<nearCount)expect(rad).toBeLessThanOrEqual(42);
        else{
          expect(rad).toBeGreaterThanOrEqual(44);
          expect(Math.hypot(p.x-DUNGEON_ARENA.x,p.z-DUNGEON_ARENA.z)).toBeGreaterThanOrEqual(30);
        }
      }
    }
  });

  it('frees scene-owned meshes once without changing scene gameplay meshes',()=>{
    const scene=new THREE.Scene(),other=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());
    scene.add(other);
    const root=buildFieldGroundCover(scene);
    const disposers=root.children.map(child=>{
      const mesh=child as THREE.InstancedMesh;
      return [vi.spyOn(mesh.geometry,'dispose'),vi.spyOn(mesh.material as THREE.Material,'dispose')] as const;
    });
    disposeFieldGroundCover(root);
    expect(root.parent).toBeNull();
    expect(scene.children).toContain(other);
    for(const [geo,mat] of disposers){
      expect(geo).toHaveBeenCalledTimes(1);
      expect(mat).toHaveBeenCalledTimes(1);
    }
  });
});
