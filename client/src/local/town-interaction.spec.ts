import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {pickTownFacility} from './town-interaction';
describe('town facility interaction',()=>{
 it('opens the portal from its opening and pillars without a sign hit',()=>{
  const scene=new THREE.Scene(),gate=new THREE.Group();gate.name='ruin-entry-gate';
  for(const x of [-2,2]){const pillar=new THREE.Mesh(new THREE.BoxGeometry(1,4,1));pillar.position.set(x,2,0);gate.add(pillar);}
  const lintel=new THREE.Mesh(new THREE.BoxGeometry(5,1,1));lintel.position.y=4;gate.add(lintel);scene.add(gate);
  const camera=new THREE.PerspectiveCamera(50,1,.1,100);camera.position.set(0,2,12);camera.lookAt(0,2,0);camera.updateMatrixWorld();
  for(const x of [0,-2,2]){const point=new THREE.Vector3(x,2,0).project(camera);expect(pickTownFacility(scene,camera,{left:20,top:30,width:600,height:600},20+(point.x+1)*300,30+(1-point.y)*300)?.id).toBe('dungeon');}
  expect(pickTownFacility(scene,camera,{left:20,top:30,width:600,height:600},21,31)).toBeUndefined();
 });
 it('selects a full building and leaves empty ground to movement',()=>{
  const scene=new THREE.Scene(),building=new THREE.Mesh(new THREE.BoxGeometry(4,4,4));building.position.set(7,2,-3);building.userData['townBuilding']=0;scene.add(building);
  const camera=new THREE.PerspectiveCamera(50,1,.1,100);camera.position.set(7,2,10);camera.lookAt(7,2,-3);camera.updateMatrixWorld();
  expect(pickTownFacility(scene,camera,{left:0,top:0,width:600,height:600},300,300)?.id).toBe('equipment');
  building.visible=false;expect(pickTownFacility(scene,camera,{left:0,top:0,width:600,height:600},300,300)).toBeUndefined();
 });
});
