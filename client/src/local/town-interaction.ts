import * as THREE from 'three';
import { TOWN_SIGNS } from './town';

/** Pick real facility geometry bounds, including the empty portal opening.
 * This is local UI interaction only: entry and purchase rules remain in session.
 */
export function pickTownFacility(scene:THREE.Scene,camera:THREE.Camera,rect:{left:number;top:number;width:number;height:number},x:number,y:number){
  scene.updateMatrixWorld(true);
  const ray=new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2),camera);
  const candidates:Array<{object:THREE.Object3D;sign:typeof TOWN_SIGNS[number]}>=[];
  for(const sign of TOWN_SIGNS){
    const object=scene.getObjectByName(sign.id==='dungeon'?'ruin-entry-gate':'town-sign-'+sign.id);
    if(object)candidates.push({object,sign});
  }
  // Buildings use the nearest existing service anchor rather than inventing services.
  for(const object of scene.children){
    if(object.userData['townBuilding']===undefined)continue;
    const sign=TOWN_SIGNS.filter(s=>s.id!=='dungeon').reduce((a,b)=>Math.hypot(a.x-object.position.x,a.z-object.position.z)<Math.hypot(b.x-object.position.x,b.z-object.position.z)?a:b);
    candidates.push({object,sign});
  }
  const hit=new THREE.Vector3();let nearest=Infinity;let selected:typeof TOWN_SIGNS[number]|undefined;
  for(const {object,sign} of candidates){
    if(!object.visible)continue;
    const box=new THREE.Box3().setFromObject(object);
    if(ray.ray.intersectBox(box,hit)){
      const distance=ray.ray.origin.distanceTo(hit);
      if(distance<nearest){nearest=distance;selected=sign;}
    }
  }
  return selected;
}
