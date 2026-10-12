import {describe,expect,it,vi} from 'vitest';
import * as THREE from 'three';
import {buildVillage} from './village';
import {buildVillageEdge,disposeVillageEdge,planVillageEdge,VILLAGE_EDGE_BATCHES,VILLAGE_EDGE_NAME} from './village-edge';

const heightAt=(x:number,z:number)=>.1*x+.04*z;
const specs=buildVillage({seed:20261012,sampleHeight:heightAt});
const ground=specs.find(s=>s.kind==='ground')!;
function get(root:THREE.Group,name:string):THREE.InstancedMesh {
  const mesh=root.getObjectByName(name);
  if(!(mesh instanceof THREE.InstancedMesh))throw Error('Missing '+name);
  return mesh;
}
function coords(mesh:THREE.InstancedMesh,i:number):THREE.Vector3 {
  const m=new THREE.Matrix4();mesh.getMatrixAt(i,m);
  return new THREE.Vector3().setFromMatrixPosition(m);
}
describe('village stone-to-grass verge transition',()=>{
  it('deterministically scatters edge chips within the paved rectangle and grasses outside it',()=>{
    const a=planVillageEdge(specs),b=planVillageEdge(specs);
    expect(a).toEqual(b);
    expect(a.chips.length).toBeGreaterThan(110);
    expect(a.chips.length).toBeLessThanOrEqual(128);
    expect(a.verge).toHaveLength(a.chips.length);
    const halfW=ground.width/2,halfD=ground.depth/2;
    for(const c of a.chips){
      expect(Math.abs(c.x-ground.x)).toBeLessThan(halfW);
      expect(Math.abs(c.z-ground.z)).toBeLessThan(halfD);
      expect(Math.max(Math.abs(c.x-ground.x)/halfW,Math.abs(c.z-ground.z)/halfD)).toBeGreaterThan(.94);
    }
    for(const p of a.verge){
      const dx=Math.abs(p.x-ground.x),dz=Math.abs(p.z-ground.z);
      expect(dx>halfW||dz>halfD).toBe(true);
      expect(dx).toBeLessThan(halfW+2);
      expect(dz).toBeLessThan(halfD+2);
      if(dz>halfD)expect(Math.abs(p.x-ground.x)).toBeGreaterThanOrEqual(2.4);
    }
  });

  it('creates two non-pickable instanced draw batches, with grass following real field height',()=>{
    const scene=new THREE.Scene(),root=buildVillageEdge(scene,specs,heightAt);
    expect(buildVillageEdge(scene,specs,heightAt)).toBe(root);
    expect(root.name).toBe(VILLAGE_EDGE_NAME);
    expect(root.children).toHaveLength(VILLAGE_EDGE_BATCHES);
    const gravel=get(root,'village-edge-gravel');
    const grass=get(root,'village-edge-grass');
    expect(grass.count).toBe(planVillageEdge(specs).verge.length);
    expect(gravel.count).toBe(planVillageEdge(specs).chips.length);
    for(const mesh of [gravel,grass]){
      expect(mesh.userData['decorative']).toBe(true);
      expect(mesh.castShadow).toBe(false);
      expect(mesh.receiveShadow).toBe(false);
      expect(new THREE.Raycaster().intersectObject(mesh)).toEqual([]);
      expect(mesh.instanceColor).not.toBeNull();
      expect(mesh.boundingSphere).not.toBeNull();
    }
    const p=coords(grass,0);
    const expected=planVillageEdge(specs).verge[0];
    expect(p.x).toBeCloseTo(expected.x,5);
    expect(p.z).toBeCloseTo(expected.z,5);
    expect(p.y).toBeCloseTo(heightAt(p.x,p.z)+.27,5);
    const c=coords(gravel,0);
    expect(c.y).toBeCloseTo(ground.y+ground.height/2+.005+.105,5);
  });

  it('tears down only its own GPU geometry and materials',()=>{
    const scene=new THREE.Scene();
    const world=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());
    scene.add(world);
    const root=buildVillageEdge(scene,specs,heightAt);
    const spies=root.children.map(n=>{
      const m=n as THREE.InstancedMesh;
      return [vi.spyOn(m.geometry,'dispose'),vi.spyOn(m.material as THREE.Material,'dispose')] as const;
    });
    disposeVillageEdge(scene);
    disposeVillageEdge(scene);
    expect(scene.children).toContain(world);
    expect(scene.getObjectByName(VILLAGE_EDGE_NAME)).toBeUndefined();
    for(const [geo,mat] of spies){expect(geo).toHaveBeenCalledOnce();expect(mat).toHaveBeenCalledOnce();}
  });

  it('does not create geometry for absent ground, and rejects invalid terrain heights',()=>{
    const scene=new THREE.Scene();
    const noFloor=specs.filter(s=>s.kind!=='ground');
    expect(planVillageEdge(noFloor)).toEqual({chips:[],verge:[]});
    expect(buildVillageEdge(scene,noFloor,heightAt).children).toHaveLength(0);
    disposeVillageEdge(scene);
    expect(()=>buildVillageEdge(scene,specs,()=>Number.NaN)).toThrow('Invalid village edge terrain height');
  });
});
