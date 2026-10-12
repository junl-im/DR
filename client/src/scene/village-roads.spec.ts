import {describe,expect,it,vi} from 'vitest';
import * as THREE from 'three';
import {buildVillage} from './village';
import {buildVillageRoads,disposeVillageRoads,planVillageRoads,VILLAGE_ROADS_NAME} from './village-roads';
import type {SceneObjectSpec} from './village';

const village=buildVillage({seed:20261012,sampleHeight:()=>2});
function instanced(root:THREE.Group,name:string):THREE.InstancedMesh {
  const mesh=root.getObjectByName(name);
  if(!(mesh instanceof THREE.InstancedMesh))throw Error('missing '+name);
  return mesh;
}
describe('Village plaza road and front-door visual plan',()=>{
  it('connects 5 shopfronts to main street without hiding within building collision AABBs',()=>{
    const plan=planVillageRoads(village);
    const houses=village.filter(s=>s.kind==='building');
    const ground=village.find(s=>s.kind==='ground')!;
    expect(houses).toHaveLength(5);
    expect(plan.entrances).toHaveLength(houses.length);
    expect(plan.stones.length).toBeGreaterThan(100);
    expect(plan.stones.length).toBeLessThan(330);
    expect(plan.stones.some(p=>p.x===0&&p.z===0)).toBe(true);
    expect(plan.stones.some(p=>p.x===12&&p.z===-4)).toBe(true);
    expect(plan.stones.some(p=>p.x===-10&&p.z===16)).toBe(true);
    for(const p of plan.stones){
      expect(p.x).toBeGreaterThanOrEqual(ground.x-ground.width/2);
      expect(p.x).toBeLessThanOrEqual(ground.x+ground.width/2);
      expect(p.z).toBeGreaterThanOrEqual(ground.z-ground.depth/2);
      expect(p.z).toBeLessThanOrEqual(ground.z+ground.depth/2);
      for(const h of houses){
        const inside=Math.abs(p.x-h.x)<=h.width/2+.48&&Math.abs(p.z-h.z)<=h.depth/2+.48;
        expect(inside).toBe(false);
      }
    }
    for(const e of plan.entrances){
      const house=houses.find(h=>h.x===e.houseX&&h.z===e.houseZ)!;
      expect(e.z).toBeGreaterThan(house.z+house.depth/2+.48);
      expect(plan.stones.some(s=>s.x===e.x&&s.z===e.z)).toBe(true);
    }
  });

  it('is deterministic, stays a maximum 2 instanced render batches, does not intercept clicks',()=>{
    const a=new THREE.Scene(),b=new THREE.Scene();
    const root=buildVillageRoads(a,village),twin=buildVillageRoads(b,village);
    expect(root.name).toBe(VILLAGE_ROADS_NAME);
    expect(buildVillageRoads(a,village)).toBe(root);
    expect(root.children).toHaveLength(2);
    const cobbles=instanced(root,'village-road-cobbles');
    const steps=instanced(root,'village-door-steps');
    expect(cobbles.count).toBe(planVillageRoads(village).stones.length);
    expect(steps.count).toBe(5);
    const matA=new THREE.Matrix4(),matB=new THREE.Matrix4();
    const cA=new THREE.Color(),cB=new THREE.Color();
    for(const name of ['village-road-cobbles','village-door-steps']){
      const first=instanced(root,name),second=instanced(twin,name);
      expect(first.castShadow).toBe(false);
      expect(first.userData['decorative']).toBe(true);
      expect(new THREE.Raycaster().intersectObject(first)).toEqual([]);
      for(const i of [0,Math.floor(first.count/2),first.count-1]){
        first.getMatrixAt(i,matA);second.getMatrixAt(i,matB);
        expect(matA.elements).toEqual(matB.elements);
        first.getColorAt(i,cA);second.getColorAt(i,cB);
        expect(cA.getHex()).toBe(cB.getHex());
      }
    }
  });

  it('releases owned GPU meshes but preserves terrain, buildings and route planning',()=>{
    const scene=new THREE.Scene();
    const house=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());
    scene.add(house);
    const root=buildVillageRoads(scene,village);
    const disposals=root.children.map(ch=>{
      const m=ch as THREE.InstancedMesh;
      return [vi.spyOn(m.geometry,'dispose'),vi.spyOn(m.material as THREE.Material,'dispose')] as const;
    });
    disposeVillageRoads(scene);
    expect(scene.children).toContain(house);
    expect(scene.getObjectByName(VILLAGE_ROADS_NAME)).toBeUndefined();
    for(const [g,m] of disposals){expect(g).toHaveBeenCalledOnce();expect(m).toHaveBeenCalledOnce();}
    disposeVillageRoads(scene);
  });

  it('does not attempt to decorate terrain when the ground spec is missing',()=>{
    const scene=new THREE.Scene();
    const houses=village.filter(s=>s.kind==='building') as SceneObjectSpec[];
    expect(planVillageRoads(houses)).toEqual({stones:[],entrances:[]});
    const root=buildVillageRoads(scene,houses);
    expect(root.children).toHaveLength(0);
    disposeVillageRoads(scene);
  });
});
