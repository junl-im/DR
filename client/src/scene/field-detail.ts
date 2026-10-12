import * as THREE from 'three';
import {snapEntityY, FEET_OFFSET} from '@nj/game-core';
import {DUNGEON_ARENA} from '../local/first-dungeon';

/** Procedural scene dressing; no external assets, physics or clickable geometry.
 * Three instanced draw calls cover the village's outer verge and field.
 */
export const FIELD_COVER_COUNTS = {grass:480,rock:72,flower:96} as const;
export const FIELD_COVER_NAME='dungeon-zero-field-cover';

type CoverKind=keyof typeof FIELD_COVER_COUNTS;

function makeRng(seed:number):()=>number {
  return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
}

/** Central village collision/path layout remains untouched. This only places
 * low-height art just beyond the 40x40 paving and in the outer field.
 */
function sampleCoverXZ(kind:CoverKind,index:number,next:()=>number):[number,number] {
  const villageCount=kind==='grass'?160:kind==='flower'?72:12;
  if(index<villageCount){
    const angle=next()*Math.PI*2;
    const radius=kind==='rock'?26+next()*15:25+next()*16;
    return [Math.cos(angle)*radius,Math.sin(angle)*radius];
  }
  for(let attempts=0;attempts<200;attempts++){
    const extent=kind==='flower'?150:195;
    const x=(next()-.5)*extent*2,z=(next()-.5)*extent*2;
    if(Math.hypot(x,z)<44)continue;
    if(Math.hypot(x-DUNGEON_ARENA.x,z-DUNGEON_ARENA.z)<30)continue;
    return [x,z];
  }
  // The RNG is deterministic and these exclusion zones are tiny relative to
  // the field. A bounded loop prevents runaway initialization if zones change.
  throw new Error('Unable to place decorative field cover');
}

function makeCoverMesh(kind:CoverKind,count:number):THREE.InstancedMesh {
  const geometry=kind==='rock'?
    new THREE.DodecahedronGeometry(.48,0):
    kind==='flower'?
      new THREE.IcosahedronGeometry(.14,0):
      new THREE.ConeGeometry(.24,.72,5);
  const material=new THREE.MeshStandardMaterial({
    color:0xffffff,roughness:1,metalness:0,flatShading:true,
    side:kind==='grass'?THREE.DoubleSide:THREE.FrontSide,
  });
  const mesh=new THREE.InstancedMesh(geometry,material,count);
  mesh.name=kind==='grass'?'field-grass-tufts':kind==='rock'?'field-mossy-stones':'field-wildflowers';
  mesh.castShadow=false;mesh.receiveShadow=false;
  mesh.raycast=()=>{};
  mesh.userData['decorative']=true;
  mesh.frustumCulled=true;
  return mesh;
}

/** Idempotent, seeded, collision-free field cover. No draw call per plant. */
export function buildFieldGroundCover(scene:THREE.Scene):THREE.Group {
  const existing=scene.getObjectByName(FIELD_COVER_NAME);
  if(existing)return existing as THREE.Group;
  const root=new THREE.Group();
  root.name=FIELD_COVER_NAME;
  const next=makeRng(20261012);
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3();
  const rotation=new THREE.Quaternion(),scale=new THREE.Vector3();
  const yAxis=new THREE.Vector3(0,1,0);

  for(const kind of ['grass','rock','flower'] as const){
    const count=FIELD_COVER_COUNTS[kind],mesh=makeCoverMesh(kind,count);
    for(let i=0;i<count;i++){
      const [x,z]=sampleCoverXZ(kind,i,next);
      const y=snapEntityY(x,z)-FEET_OFFSET;
      const size=kind==='rock'?.52+next()*.82:.7+next()*.72;
      const rise=kind==='rock'?.24*size:kind==='flower'?.37+.06*size:.36*size;
      position.set(x,y+rise,z);
      rotation.setFromAxisAngle(yAxis,next()*Math.PI*2);
      scale.set(kind==='rock'?size*1.22:size,size,kind==='rock'?size*.85:size);
      matrix.compose(position,rotation,scale);
      mesh.setMatrixAt(i,matrix);
      const tone=next();
      const color=kind==='rock'?
        (tone>.5?0x777969:0x626a60):
        kind==='flower'?
          (tone>.67?0xd9c38a:tone>.34?0xbca2bc:0xf0d4a4):
          (tone>.7?0x91a36d:tone>.32?0x6f874f:0x526d39);
      mesh.setColorAt(i,new THREE.Color(color));
    }
    mesh.instanceMatrix.needsUpdate=true;
    if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    mesh.computeBoundingSphere(); // Real culling bounds for spread-out instances.
    root.add(mesh);
  }
  scene.add(root);
  return root;
}

/** All three geometries/materials are owned here, unlike shared GLB assets. */
export function disposeFieldGroundCover(root:THREE.Group):void {
  for(const child of root.children){
    if(child instanceof THREE.InstancedMesh){
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
    }
  }
  root.removeFromParent();
}
