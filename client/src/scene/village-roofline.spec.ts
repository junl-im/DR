import {describe,expect,it,vi} from 'vitest';
import * as THREE from 'three';
import {buildVillage} from './village';
import {buildVillageRooflines,disposeVillageRooflines,ROOFLINE_DRAW_BATCHES,VILLAGE_ROOFLINES_NAME} from './village-roofline';

const specs=buildVillage({seed:20261012,sampleHeight:()=>0});
function batch(root:THREE.Group,name:string):THREE.InstancedMesh {
  const mesh=root.getObjectByName(name);
  if(!(mesh instanceof THREE.InstancedMesh))throw Error('Missing '+name);
  return mesh;
}
function at(mesh:THREE.InstancedMesh,i:number):THREE.Vector3 {
  const m=new THREE.Matrix4();mesh.getMatrixAt(i,m);
  return new THREE.Vector3().setFromMatrixPosition(m);
}
describe('project-authored village house variety',()=>{
  it('adds five house-specific architectural features using no per-object lights or raycast',()=>{
    const scene=new THREE.Scene();
    const root=buildVillageRooflines(scene,specs);
    expect(root.name).toBe(VILLAGE_ROOFLINES_NAME);
    expect(root.children).toHaveLength(ROOFLINE_DRAW_BATCHES);
    expect(buildVillageRooflines(scene,specs)).toBe(root);
    expect(batch(root,'village-roof-shingles').count).toBe(4*2*6*4);
    expect(batch(root,'village-roof-finials').count).toBe(5);
    expect(batch(root,'village-chimney-caps').count).toBe(3);
    expect(batch(root,'village-roof-dormers').count).toBe(2);
    expect(batch(root,'village-watchtower-belt').count).toBe(4);
    for(const mesh of root.children as THREE.InstancedMesh[]){
      expect(mesh.userData['decorative']).toBe(true);
      expect(mesh.castShadow).toBe(false);
      expect(mesh.receiveShadow).toBe(false);
      expect(mesh.boundingSphere).not.toBeNull();
      expect(new THREE.Raycaster().intersectObject(mesh)).toEqual([]);
    }
    expect(root.children.some(x=>x instanceof THREE.Light)).toBe(false);
  });

  it('anchors roof trim to the five unchanged GLB house plot centers',()=>{
    const root=buildVillageRooflines(new THREE.Scene(),specs);
    const houses=specs.filter(s=>s.kind==='building');
    const finials=batch(root,'village-roof-finials');
    const caps=batch(root,'village-chimney-caps');
    expect(houses).toHaveLength(5);
    // House 0 roof height: .7 stone foundation + 3.2 wall + 2.4 roof.
    const a=at(finials,0);
    expect(a.x).toBeCloseTo(houses[0].x-6*.32,4);
    expect(a.y).toBeCloseTo(.7+3.2+2.4+.30,4);
    expect(a.z).toBeCloseTo(houses[0].z,4);
    const b=at(finials,4);
    expect(b.x).toBeCloseTo(houses[4].x,4);
    expect(b.y).toBeCloseTo(.7+6.5+3.4+.42,4);
    const cap=at(caps,0);
    expect(cap.x).toBeCloseTo(houses[0].x+6/2-.9,4);
    expect(cap.z).toBeCloseTo(houses[0].z-5/2+.9,4);
    expect(cap.y).toBeCloseTo(.7+3.2+2.4+1,4);
  });

  it('preserves the original house geometry and produces repeatable transforms and shades',()=>{
    const before=structuredClone(specs);
    const a=buildVillageRooflines(new THREE.Scene(),specs);
    const b=buildVillageRooflines(new THREE.Scene(),specs);
    expect(specs).toEqual(before);
    for(const name of ['village-roof-shingles','village-roof-finials','village-watchtower-belt']){
      const left=batch(a,name),right=batch(b,name);
      const ma=new THREE.Matrix4(),mb=new THREE.Matrix4();
      const ca=new THREE.Color(),cb=new THREE.Color();
      for(const i of [0,Math.floor(left.count/2),left.count-1]){
        left.getMatrixAt(i,ma);right.getMatrixAt(i,mb);
        expect(ma.elements).toEqual(mb.elements);
        left.getColorAt(i,ca);right.getColorAt(i,cb);
        expect(ca.getHex()).toBe(cb.getHex());
      }
    }
  });

  it('disposes only its owned batches even if called twice',()=>{
    const scene=new THREE.Scene();
    const house=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());
    scene.add(house);
    const root=buildVillageRooflines(scene,specs);
    const spies=root.children.map(node=>{
      const mesh=node as THREE.InstancedMesh;
      return [vi.spyOn(mesh.geometry,'dispose'),vi.spyOn(mesh.material as THREE.Material,'dispose')] as const;
    });
    disposeVillageRooflines(scene);
    disposeVillageRooflines(scene);
    expect(scene.children).toContain(house);
    expect(scene.getObjectByName(VILLAGE_ROOFLINES_NAME)).toBeUndefined();
    for(const [geometry,material] of spies){
      expect(geometry).toHaveBeenCalledOnce();
      expect(material).toHaveBeenCalledOnce();
    }
  });
});
