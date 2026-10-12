import * as THREE from 'three';
import {snapEntityY, FEET_OFFSET} from '@nj/game-core';
import {DUNGEON_ARENA} from '../local/first-dungeon';

/** Deterministic, collision-free ground dressing with only two instanced meshes.
 * Existing licensed trees/buildings remain unchanged; no extra downloads.
 */
export function buildFieldGroundCover(scene:THREE.Scene):THREE.Group {
  const existing=scene.getObjectByName('dungeon-zero-field-cover');
  if(existing)return existing as THREE.Group;
  const root=new THREE.Group();root.name='dungeon-zero-field-cover';
  let seed=20261012;
  const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const grass=new THREE.InstancedMesh(
    new THREE.ConeGeometry(.28,.92,5),new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}),120);
  grass.name='field-grass-tufts';grass.castShadow=false;grass.receiveShadow=false;
  const rocks=new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(.56,0),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.94}),48);
  rocks.name='field-mossy-stones';rocks.castShadow=false;rocks.receiveShadow=false;
  // Vegetation is not a click target or an obstacle. Only mobs and terrain
  // participate in the player's existing world picking/movement system.
  grass.raycast=()=>{};rocks.raycast=()=>{};
  grass.userData['decorative']=true;rocks.userData['decorative']=true;
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3();
  for(const [mesh,count,kind] of [[grass,120,'grass'],[rocks,48,'rock']] as const){
    let placed=0;
    while(placed<count){
      const x=(next()-.5)*390,z=(next()-.5)*390;
      if(Math.hypot(x,z)<43||Math.hypot(x-DUNGEON_ARENA.x,z-DUNGEON_ARENA.z)<28)continue;
      const y=snapEntityY(x,z)-FEET_OFFSET;
      position.set(x,y+(kind==='grass'?.39:.28),z);
      rotation.setFromAxisAngle(new THREE.Vector3(0,1,0),next()*Math.PI*2);
      const size=kind==='grass'?.7+next()*.65:.55+next()*.85;
      scale.set(kind==='grass'?size:size*1.2,size,kind==='grass'?size:size*.8);
      matrix.compose(position,rotation,scale);
      mesh.setMatrixAt(placed,matrix);
      mesh.setColorAt(placed,new THREE.Color(kind==='grass'?(next()>.5?0x637345:0x899364):(next()>.5?0x777969:0x5b6258)));
      placed++;
    }
    mesh.instanceMatrix.needsUpdate=true;
  }
  root.add(grass,rocks);scene.add(root);return root;
}
