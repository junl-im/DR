import * as THREE from 'three';
import type { SceneObjectSpec } from './village';

/** Existing authored GLB houses have entrances at +Z, at ground-base y=0.
 * Cosmetic street frontage only. Neither blockers nor quests use these meshes.
 */
export const VILLAGE_FACADE_NAME = 'dungeon-zero-village-facades';
export const FACADE_MAX_BATCHES = 5;
export const FACADE_LIGHTS_PER_HOUSE = 2;

const HOUSE_SIGN_COLORS = [
  0x9c6941, // blacksmith
  0x557b6b, // apothecary
  0x947245, // general merchant
  0x895d5b, // inn
  0x7c7085, // watch house
] as const;

type BatchName = 'facade-plaques' | 'facade-medallions' | 'facade-awnings' | 'facade-lanterns' | 'facade-brackets';

function makeBatch(name: BatchName, geometry: THREE.BufferGeometry, count: number): THREE.InstancedMesh {
  const isLantern=name==='facade-lanterns';
  const material=new THREE.MeshStandardMaterial({
    color:0xffffff,
    metalness:isLantern?.2:name==='facade-medallions'?.5:.05,
    roughness:isLantern?.36:.83,
    emissive:isLantern?0x4f2d0b:0x000000,
    emissiveIntensity:isLantern?.75:0,
    side:name==='facade-medallions'?THREE.DoubleSide:THREE.FrontSide,
    flatShading:true,
  });
  const mesh=new THREE.InstancedMesh(geometry,material,count);
  mesh.name=name;
  mesh.userData['decorative']=true;
  mesh.raycast=()=>{}; // Existing building/ground raycasting is unchanged.
  mesh.castShadow=false;
  mesh.receiveShadow=false;
  return mesh;
}

function setInstance(
  mesh:THREE.InstancedMesh,index:number,
  x:number,y:number,z:number,color:number,
  tiltX=0,
):void {
  const pos=new THREE.Vector3(x,y,z);
  const rot=new THREE.Quaternion().setFromEuler(new THREE.Euler(tiltX,0,0));
  mesh.setMatrixAt(index,new THREE.Matrix4().compose(pos,rot,new THREE.Vector3(1,1,1)));
  mesh.setColorAt(index,new THREE.Color(color));
}

/** 5 instanced batches, all props attached visually to the actual house face.
 * No PointLight per lantern: warm emissive material preserves mobile perf.
 */
export function buildVillageFacades(scene:THREE.Scene,specs:readonly SceneObjectSpec[]):THREE.Group {
  const existing=scene.getObjectByName(VILLAGE_FACADE_NAME);
  if(existing)return existing as THREE.Group;

  const buildings=specs.filter(spec=>spec.kind==='building');
  const root=new THREE.Group();
  root.name=VILLAGE_FACADE_NAME;
  if(buildings.length===0){scene.add(root);return root;}

  const boards=makeBatch('facade-plaques',new THREE.BoxGeometry(1.85,.68,.14),buildings.length);
  const coins=makeBatch('facade-medallions',new THREE.CylinderGeometry(.24,.24,.05,8),buildings.length);
  const awnings=makeBatch('facade-awnings',new THREE.BoxGeometry(2.1,.12,.85),buildings.length);
  const lamps=makeBatch('facade-lanterns',new THREE.BoxGeometry(.25,.4,.24),buildings.length*2);
  const brackets=makeBatch('facade-brackets',new THREE.BoxGeometry(.08,.08,.42),buildings.length*2);

  for(let i=0;i<buildings.length;i++){
    const spec=buildings[i];
    const groundY=spec.y-spec.height/2;
    const wallZ=spec.z+spec.depth/2;
    const signTint=HOUSE_SIGN_COLORS[i%HOUSE_SIGN_COLORS.length];

    // Entrance details float outside the +Z front wall; no new floor blockers.
    setInstance(boards,i,spec.x,groundY+3.38,wallZ+.24,signTint);
    // A metal disc faces forward; cylinder axis is rotated so its normal is +Z.
    // Geometric disc remains a neutral emblem, not an unreadable tiny text.
    setInstance(coins,i,spec.x,groundY+3.39,wallZ+.34,0xdac38a,Math.PI/2);
    setInstance(awnings,i,spec.x,groundY+2.97,wallZ+.55,0x6e503c,-.17);

    for(const side of [-1,1] as const){
      const j=2*i+(side===-1?0:1);
      setInstance(brackets,j,spec.x+side*1.23,groundY+3.07,wallZ+.22,0x403a33);
      setInstance(lamps,j,spec.x+side*1.23,groundY+2.73,wallZ+.43,
        i===4?0xe2c89e:0xf6c56b);
    }
  }

  for(const mesh of [boards,coins,awnings,lamps,brackets]){
    mesh.instanceMatrix.needsUpdate=true;
    if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    mesh.computeBoundingSphere();
    root.add(mesh);
  }
  scene.add(root);
  return root;
}

/** This module owns the instanced buffers/materials, not the shared house GLBs. */
export function disposeVillageFacades(scene:THREE.Scene):void {
  const root=scene.getObjectByName(VILLAGE_FACADE_NAME);
  if(!root)return;
  root.traverse(child=>{
    if(child instanceof THREE.InstancedMesh){
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
    }
  });
  root.removeFromParent();
}
