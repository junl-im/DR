import * as THREE from 'three';
import { snapEntityY, FEET_OFFSET } from '@nj/game-core';
import { POTION_SHOP } from './session';

export const TOWN_SIGNS = [
  {id:'shop',name:'마을 보급 상점',x:POTION_SHOP.x,z:POTION_SHOP.z,panel:'shop' as const},
  {id:'equipment',name:'장비 정비 안내',x:7,z:-3,panel:'inventory' as const},
  {id:'garden',name:'영지 관리 안내',x:-7,z:3,panel:'estate' as const},
  {id:'journey',name:'모험 안내판',x:-2,z:4,panel:'help' as const},
];
/** Decorative signs and foliage do not alter the shared navigation mesh. */
export function buildTownDetails(scene: THREE.Scene): void {
  const group=new THREE.Group();group.name='dungeon-zero-town-details';
  const wood=new THREE.MeshStandardMaterial({color:'#66513b',roughness:1});
  for(const sign of TOWN_SIGNS){
    const post=new THREE.Mesh(new THREE.BoxGeometry(.15,1.5,.15),wood);
    const board=new THREE.Mesh(new THREE.BoxGeometry(1.2,.55,.12),wood);
    const y=snapEntityY(sign.x,sign.z)-FEET_OFFSET;post.position.set(sign.x,y+.75,sign.z);board.position.set(sign.x,y+1.4,sign.z);post.castShadow=board.castShadow=true;group.add(post,board);
  }
  const shrubGeometry=new THREE.IcosahedronGeometry(.55,1), shrubMaterial=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:1,emissive:'#30401c',emissiveIntensity:.3});
  const shrubs=new THREE.InstancedMesh(shrubGeometry,shrubMaterial,32), matrix=new THREE.Matrix4();
  for(let i=0;i<32;i++){
    const centers=[[20,20],[-22,-18],[27,-10],[-25,9],[4,-27],[-8,25]];
    const center=centers[i%centers.length],angle=i*2.39996,radius=.8+Math.floor(i/6)*.65;
    const x=center[0]+Math.cos(angle)*radius,z=center[1]+Math.sin(angle)*radius;
    matrix.compose(new THREE.Vector3(x,snapEntityY(x,z)-FEET_OFFSET+.25,z),new THREE.Quaternion(),new THREE.Vector3(1.1+(i%3)*.3,.8,1));shrubs.setMatrixAt(i,matrix);shrubs.setColorAt(i,new THREE.Color(i%3===0?'#6d7d42':'#536334'));
  }
  shrubs.castShadow=true;shrubs.receiveShadow=true;group.add(shrubs);
  scene.add(group);
}
