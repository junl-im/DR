import * as THREE from 'three';
import { FEET_OFFSET, snapEntityY } from '@nj/game-core';
import { DUNGEON_ARENA } from '../local/first-dungeon';

/** Dungeon-only lighting and low-poly sconces: scenery, not a collision map.
 * Both lights stay off outside the instance; mobile has a one-light budget.
 */
export function createRuinAtmosphere(scene:THREE.Scene,mobile=false) {
  const root=new THREE.Group();
  root.name='dungeon-zero-ruin-atmosphere';
  root.visible=false;
  let active=false;
  const lights:THREE.PointLight[]=[];
  const flameMaterial=new THREE.MeshStandardMaterial({
    color:0xffc88d,emissive:0xff8844,emissiveIntensity:1.15,
    roughness:.85,metalness:0,
  });
  const sconceMaterial=new THREE.MeshStandardMaterial({
    color:0x565c60,metalness:.36,roughness:.86,flatShading:true,
  });
  const sconceGeo=new THREE.CylinderGeometry(.23,.32,.72,6);
  const flameGeo=new THREE.IcosahedronGeometry(.24,0);
  // Torches flank the room without changing pathfinding or enemy hit boxes.
  const anchors=[[-9,0],[9,0]] as const;
  anchors.forEach(([dx,dz],i)=>{
    const x=DUNGEON_ARENA.x+dx,z=DUNGEON_ARENA.z+dz;
    const group=new THREE.Group();
    group.position.set(x,snapEntityY(x,z)-FEET_OFFSET,z);
    group.name='ruin-torch-'+i;
    const base=new THREE.Mesh(sconceGeo,sconceMaterial);
    base.position.y=1.1;base.userData['decorative']=true;
    base.raycast=()=>{};base.castShadow=false;
    const flame=new THREE.Mesh(flameGeo,flameMaterial);
    flame.position.y=1.61;flame.userData['decorative']=true;
    flame.raycast=()=>{};flame.castShadow=false;
    group.add(base,flame);
    if(!mobile||i===0){
      const light=new THREE.PointLight(i===0?0xffa45b:0x8dcad9,mobile?18:20,19,2);
      light.name='ruin-torch-light-'+i;
      light.position.y=1.8;
      light.castShadow=false;
      group.add(light);lights.push(light);
    }
    root.add(group);
  });
  scene.add(root);
  return {
    root,
    lightCount:lights.length,
    setActive(value:boolean) {
      if(active===value)return;
      active=value;root.visible=value;
      // Children belong to a hidden parent; disabling intensity as well
      // prevents offscreen lighting work on some Three.js renderer versions.
      lights.forEach((light,i)=>{light.intensity=value?(mobile?18:20):0;});
    },
    get active(){return active;},
    dispose() {
      root.removeFromParent();
      sconceGeo.dispose();flameGeo.dispose();
      sconceMaterial.dispose();flameMaterial.dispose();
      lights.forEach(light=>light.dispose());
    },
  };
}
