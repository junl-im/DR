import * as THREE from 'three';
import { snapEntityY, FEET_OFFSET } from '@nj/game-core';
import { POTION_SHOP } from './session';
import { DUNGEON_GATE } from './first-dungeon';

export const TOWN_SIGNS = [
  {id:'shop',name:'마을 보급 상점',x:POTION_SHOP.x,z:POTION_SHOP.z,panel:'shop' as const},
  {id:'equipment',name:'장비 정비 안내',x:7,z:-3,panel:'inventory' as const},
  {id:'garden',name:'영지 관리 안내',x:-7,z:3,panel:'estate' as const},
  {id:'journey',name:'모험 안내판',x:-2,z:4,panel:'help' as const},
  {id:'dungeon',name:'폐허의 관문',x:DUNGEON_GATE.x,z:DUNGEON_GATE.z,panel:'dungeon' as const},
];

/**
 * Art-only dressing. No world collision boxes, no navigation changes and no
 * collision targets. Local facility UI picking is handled by town-interaction.
 * Keep the existing sign anchors aligned with the existing interaction overlays.
 */
export function buildTownDetails(scene: THREE.Scene): void {
  if (scene.getObjectByName('dungeon-zero-town-details')) return;
  const group=new THREE.Group();
  group.name='dungeon-zero-town-details';

  // A single material set across the town makes the original low-poly props
  // read as matching hand-built timber signs rather than plain brown cubes.
  const timber=new THREE.MeshStandardMaterial({color:'#624934',roughness:.88});
  const woodFace=new THREE.MeshStandardMaterial({color:'#8d7050',roughness:.94});
  const iron=new THREE.MeshStandardMaterial({color:'#333934',metalness:.57,roughness:.48});
  const gold=new THREE.MeshStandardMaterial({color:'#a89261',metalness:.42,roughness:.55});
  const parchment=new THREE.MeshStandardMaterial({color:'#d6c5a0',roughness:.96});
  const lightMaterial=new THREE.MeshStandardMaterial({color:'#ffcf85',emissive:'#ffae4f',emissiveIntensity:1.3,roughness:.4});

  const postGeom=new THREE.BoxGeometry(.17,1.6,.17);
  const frameHorizontal=new THREE.BoxGeometry(1.46,.075,.2);
  const frameVertical=new THREE.BoxGeometry(.075,.71,.2);
  const plaqueGeom=new THREE.BoxGeometry(1.34,.6,.13);
  const smallBoltGeom=new THREE.SphereGeometry(.027,6,4);
  const railGeom=new THREE.BoxGeometry(.07,.42,.08);
  const lampGeom=new THREE.BoxGeometry(.23,.28,.23);

  for (const sign of TOWN_SIGNS) {
    const y=snapEntityY(sign.x,sign.z)-FEET_OFFSET;
    const signGroup=new THREE.Group();
    signGroup.name='town-sign-'+sign.id;
    signGroup.position.set(sign.x,y,sign.z);

    const post=new THREE.Mesh(postGeom,timber);post.position.y=.8;post.castShadow=true;
    const face=new THREE.Mesh(plaqueGeom,woodFace);face.position.y=1.43;face.castShadow=true;
    signGroup.add(post,face);
    // Facing both sides of the fixed diagonal view avoids unreadable thin signs.
    for (const edge of [-1,1]) {
      const cross=new THREE.Mesh(frameHorizontal,iron);
      cross.position.set(0,1.43+edge*.335,0);signGroup.add(cross);
      const upright=new THREE.Mesh(frameVertical,iron);
      upright.position.set(edge*.7,1.43,0);signGroup.add(upright);
      for(const z of [-.108,.108]) {
        const bolt=new THREE.Mesh(smallBoltGeom,gold);
        bolt.position.set(edge*.59,1.43,z);
        signGroup.add(bolt);
      }
    }
    const inset=new THREE.Mesh(new THREE.BoxGeometry(.96,.32,.016),parchment);
    inset.position.set(0,1.43,.076);signGroup.add(inset);
    const insetBack=inset.clone();insetBack.position.z=-.076;signGroup.add(insetBack);

    // Only 2 unshadowed lights: decorative amber beacons, not a new global
    // lighting system. Mobile rendering cost still needs measurement.
    if(sign.id==='shop'||sign.id==='journey') {
      const bracket=new THREE.Mesh(railGeom,iron);
      bracket.position.set(.55,1.87,0);signGroup.add(bracket);
      const lamp=new THREE.Mesh(lampGeom,lightMaterial);
      lamp.position.set(.55,1.69,0);signGroup.add(lamp);
      const glow=new THREE.PointLight('#ffc78f',.9,5,2);
      glow.position.copy(lamp.position);
      glow.castShadow=false;
      signGroup.add(glow);
    }
    group.add(signGroup);
  }

  const shrubGeometry=new THREE.IcosahedronGeometry(.55,1);
  const shrubMaterial=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:1,emissive:'#30401c',emissiveIntensity:.3});
  const shrubs=new THREE.InstancedMesh(shrubGeometry,shrubMaterial,32);
  shrubs.name='town-edge-foliage';
  const matrix=new THREE.Matrix4();
  for(let i=0;i<32;i++){
    const centers=[[20,20],[-22,-18],[27,-10],[-25,9],[4,-27],[-8,25]];
    const center=centers[i%centers.length],angle=i*2.39996,radius=.8+Math.floor(i/6)*.65;
    const x=center[0]+Math.cos(angle)*radius,z=center[1]+Math.sin(angle)*radius;
    matrix.compose(new THREE.Vector3(x,snapEntityY(x,z)-FEET_OFFSET+.25,z),new THREE.Quaternion(),new THREE.Vector3(1.1+(i%3)*.3,.8,1));
    shrubs.setMatrixAt(i,matrix);
    shrubs.setColorAt(i,new THREE.Color(i%3===0?'#6d7d42':'#536334'));
  }
  shrubs.instanceMatrix.needsUpdate=true;
  shrubs.castShadow=true;shrubs.receiveShadow=true;group.add(shrubs);
  scene.add(group);
}
