import * as THREE from 'three';
import { snapEntityY,FEET_OFFSET } from '@nj/game-core';
import {DUNGEON_GATE,DUNGEON_ARENA} from '../local/first-dungeon';

/** Decorative 3D ruin. Navigation, terrain raycasts and game hitboxes are unchanged. */
export function buildFirstDungeonArt(scene:THREE.Scene):THREE.Group {
  const existing=scene.getObjectByName('dungeon-zero-first-ruin');
  if(existing)return existing as THREE.Group;
  const root=new THREE.Group();
  root.name='dungeon-zero-first-ruin';
  const stone=new THREE.MeshStandardMaterial({color:0x5b5c59,roughness:.96,flatShading:true});
  const trim=new THREE.MeshStandardMaterial({color:0x8a8068,metalness:.25,roughness:.83});
  const dark=new THREE.MeshStandardMaterial({color:0x282b30,roughness:.94});
  const rune=new THREE.MeshStandardMaterial({color:0x8eb8c3,emissive:0x3b7384,emissiveIntensity:.8});
  const add=(parent:THREE.Object3D,geo:THREE.BufferGeometry,mat:THREE.Material,x:number,y:number,z:number,cast=true)=>{
    const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=true;m.userData['decorative']=true;m.raycast=()=>{};parent.add(m);return m;
  };

  const gate=new THREE.Group();gate.name='ruin-entry-gate';
  const gateY=snapEntityY(DUNGEON_GATE.x,DUNGEON_GATE.z)-FEET_OFFSET;
  gate.position.set(DUNGEON_GATE.x,gateY,DUNGEON_GATE.z);
  const columnGeo=new THREE.CylinderGeometry(.37,.47,3.6,6);
  for(const x of [-2.1,2.1]){
    add(gate,columnGeo,stone,x,1.8,0);
    add(gate,new THREE.BoxGeometry(.9,.25,.9),trim,x,3.62,0);
  }
  add(gate,new THREE.BoxGeometry(5.1,.65,1),stone,0,3.95,0);
  add(gate,new THREE.IcosahedronGeometry(.38,0),rune,0,4.35,0);
  const portal=add(gate,new THREE.PlaneGeometry(3.8,3.2),dark,0,1.75,.13,false);
  (portal.material as THREE.MeshStandardMaterial).side=THREE.DoubleSide;
  root.add(gate);

  const arena=new THREE.Group();arena.name='ruin-arena-decoration';
  arena.position.set(DUNGEON_ARENA.x,0,DUNGEON_ARENA.z);
  const tile=new THREE.BoxGeometry(1.7,.12,1.7);
  const wornTiles=new THREE.MeshStandardMaterial({
    color:0xb2b0a6,roughness:.98,metalness:0,flatShading:true,
  });
  const tiles=new THREE.InstancedMesh(tile,wornTiles,196);
  tiles.name='ruin-cracked-paving';
  tiles.receiveShadow=true;tiles.castShadow=false;
  const transform=new THREE.Matrix4();
  let index=0;
  for(let z=-7;z<7;z++)for(let x=-7;x<7;x++){
    const px=x*1.8+.7,pz=z*1.8+.7;
    const y=snapEntityY(DUNGEON_ARENA.x+px,DUNGEON_ARENA.z+pz)-FEET_OFFSET+.06;
    transform.makeTranslation(px,y,pz);
    tiles.setMatrixAt(index,transform);
    // Three muted stone families break up the monotone grey floor.
    const palette=[0xa8a89f,0x92938e,0xc6bda6] as const;
    tiles.setColorAt(index,new THREE.Color(palette[(index*37+Math.floor(index/14))%palette.length]));
    index++;
  }
  tiles.instanceMatrix.needsUpdate=true;
  tiles.userData['decorative']=true;tiles.raycast=()=>{};arena.add(tiles);
  const pillarGeo=new THREE.CylinderGeometry(.6,.8,5.5,6);
  for(const [x,z] of [[-10,-10],[10,-10],[-10,10],[10,10]]){
    const y=snapEntityY(DUNGEON_ARENA.x+x,DUNGEON_ARENA.z+z)-FEET_OFFSET;
    add(arena,pillarGeo,stone,x,y+2.75,z);
    add(arena,new THREE.BoxGeometry(1.9,.33,1.9),trim,x,y+5.5,z);
  }
  for(const [x,z] of [[-6,-12],[6,-12],[-6,12],[6,12]]){
    const y=snapEntityY(DUNGEON_ARENA.x+x,DUNGEON_ARENA.z+z)-FEET_OFFSET;
    add(arena,new THREE.DodecahedronGeometry(.9,0),dark,x,y+.4,z);
  }
  const bossRune=add(arena,new THREE.TorusGeometry(4,.095,6,52),rune,0,
    snapEntityY(DUNGEON_ARENA.x,DUNGEON_ARENA.z-6)-FEET_OFFSET+.11,-6,false);
  bossRune.rotation.x=-Math.PI/2;bossRune.name='ruin-boss-sigil';
  // Instanced shattered stones around the outer perimeter. The central
  // corridor and boss arena remain unobstructed; no collision or raycast.
  const debris=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.42,0),stone,48);
  debris.name='ruin-perimeter-rubble';
  debris.castShadow=false;debris.receiveShadow=true;
  debris.userData['decorative']=true;debris.raycast=()=>{};
  const rubbleMatrix=new THREE.Matrix4();
  const rubbleQuat=new THREE.Quaternion();
  const rubbleScale=new THREE.Vector3();
  for(let i=0;i<48;i++){
    const edge=i%4;
    const along=-11+(Math.floor(i/4)%12)*2;
    const offset=.35+(i%3)*.19;
    const x=edge===0?-12+offset:edge===1?12-offset:along;
    const z=edge===2?-12+offset:edge===3?12-offset:along;
    const y=snapEntityY(DUNGEON_ARENA.x+x,DUNGEON_ARENA.z+z)-FEET_OFFSET+.18;
    rubbleQuat.setFromAxisAngle(new THREE.Vector3(0,1,0),i*1.618);
    const scale=.55+(i%5)*.12;
    rubbleScale.set(scale,scale*.46,scale*.88);
    rubbleMatrix.compose(new THREE.Vector3(x,y,z),rubbleQuat,rubbleScale);
    debris.setMatrixAt(i,rubbleMatrix);
  }
  debris.instanceMatrix.needsUpdate=true;
  arena.add(debris);
  root.add(arena);
  scene.add(root);
  return root;
}
