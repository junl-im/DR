import {describe,expect,it,vi} from 'vitest';
import * as THREE from 'three';
import {buildVillageFacades,disposeVillageFacades,FACADE_MAX_BATCHES,FACADE_LIGHTS_PER_HOUSE,VILLAGE_FACADE_NAME} from './village-facade';
import type {SceneObjectSpec} from './village';

const specs:SceneObjectSpec[]=[
  {kind:'ground',x:0,y:0,z:0,width:40,depth:40,height:.1,color:0xaaaaaa},
  {kind:'building',x:8,y:2,z:11,width:6,depth:5,height:4,color:0xaaaaaa},
  {kind:'building',x:-12,y:3,z:-4,width:5,depth:6,height:6,color:0xbbbbbb},
  {kind:'peace-zone',x:0,y:3,z:0,width:2,depth:2,height:6,color:0xeeeeee},
];
function find(root:THREE.Group,name:string):THREE.InstancedMesh {
  const mesh=root.getObjectByName(name);
  if(!(mesh instanceof THREE.InstancedMesh))throw Error('Missing '+name);
  return mesh;
}
function where(mesh:THREE.InstancedMesh,index:number):THREE.Vector3 {
  const mat=new THREE.Matrix4();
  mesh.getMatrixAt(index,mat);
  return new THREE.Vector3().setFromMatrixPosition(mat);
}
describe('noninteractive village storefront / lantern architecture',()=>{
  it('uses exactly five GPU-instanced batches without raycasts or shadow-heavy lights',()=>{
    const scene=new THREE.Scene();
    const root=buildVillageFacades(scene,specs);
    expect(root.name).toBe(VILLAGE_FACADE_NAME);
    expect(root.children).toHaveLength(FACADE_MAX_BATCHES);
    expect(buildVillageFacades(scene,specs)).toBe(root);
    expect(find(root,'facade-plaques').count).toBe(2);
    expect(find(root,'facade-medallions').count).toBe(2);
    expect(find(root,'facade-awnings').count).toBe(2);
    expect(find(root,'facade-lanterns').count).toBe(2*FACADE_LIGHTS_PER_HOUSE);
    expect(find(root,'facade-brackets').count).toBe(2*FACADE_LIGHTS_PER_HOUSE);
    for(const mesh of root.children as THREE.InstancedMesh[]){
      expect(mesh.castShadow).toBe(false);
      expect(mesh.userData['decorative']).toBe(true);
      expect(new THREE.Raycaster().intersectObject(mesh)).toEqual([]);
      expect(mesh.boundingSphere).not.toBeNull();
    }
    expect(root.children.some(x=>x instanceof THREE.Light)).toBe(false);
    expect((find(root,'facade-lanterns').material as THREE.MeshStandardMaterial).emissiveIntensity).toBeGreaterThan(0);
  });

  it('aligns door sign and lamps to +Z face and ground height from the original spec',()=>{
    const root=buildVillageFacades(new THREE.Scene(),specs);
    const sign=find(root,'facade-plaques');
    const lamps=find(root,'facade-lanterns');
    const first=specs[1],ground=first.y-first.height/2;
    const position=where(sign,0);
    expect(position.x).toBeCloseTo(first.x);
    expect(position.y).toBeCloseTo(ground+3.38);
    expect(position.z).toBeCloseTo(first.z+first.depth/2+.24);
    const a=where(lamps,0),b=where(lamps,1);
    expect(a.x).toBeCloseTo(first.x-1.23);
    expect(b.x).toBeCloseTo(first.x+1.23);
    expect(a.y).toBeCloseTo(ground+2.73);
    expect(a.z).toBeGreaterThan(first.z+first.depth/2);
    expect(b.z).toBeGreaterThan(first.z+first.depth/2);
    expect(where(sign,1).x).toBeCloseTo(specs[2].x);
  });

  it('is reproducible, changes only cosmetic instance colors and frees owned GPU buffers',()=>{
    const scene=new THREE.Scene();
    const worldMesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());
    scene.add(worldMesh);
    const root=buildVillageFacades(scene,specs);
    const other=buildVillageFacades(new THREE.Scene(),specs);
    for(const name of ['facade-plaques','facade-lanterns']){
      const first=find(root,name),second=find(other,name);
      const a=new THREE.Matrix4(),b=new THREE.Matrix4();
      first.getMatrixAt(0,a);second.getMatrixAt(0,b);
      expect(a.elements).toEqual(b.elements);
      const c=new THREE.Color(),d=new THREE.Color();
      first.getColorAt(0,c);second.getColorAt(0,d);
      expect(c.getHex()).toBe(d.getHex());
    }
    const spies=root.children.map(child=>{
      const mesh=child as THREE.InstancedMesh;
      return [vi.spyOn(mesh.geometry,'dispose'),vi.spyOn(mesh.material as THREE.Material,'dispose')] as const;
    });
    disposeVillageFacades(scene);
    expect(scene.children).toContain(worldMesh);
    expect(scene.getObjectByName(VILLAGE_FACADE_NAME)).toBeUndefined();
    for(const [geometry,material] of spies){
      expect(geometry).toHaveBeenCalledTimes(1);
      expect(material).toHaveBeenCalledTimes(1);
    }
    disposeVillageFacades(scene);
  });

  it('does not allocate geometry or draw batches without buildings',()=>{
    const scene=new THREE.Scene();
    const root=buildVillageFacades(scene,[specs[0],specs[3]]);
    expect(root.children).toHaveLength(0);
    expect(root.parent).toBe(scene);
    disposeVillageFacades(scene);
  });
});
