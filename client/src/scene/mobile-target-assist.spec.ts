import {describe,expect,it} from 'vitest';
import * as THREE from 'three';
import {selectMobNearScreenTap,type TapMob} from './mobile-target-assist';

const camera=()=>{
  const c=new THREE.PerspectiveCamera(40,1,0.1,200);
  c.position.set(0,11,15);c.lookAt(0,0,0);c.updateMatrixWorld();c.updateProjectionMatrix();return c;
};
const mob:TapMob={id:'small',x:0,y:0,z:0,hp:40,barY:1.6};
const coords=(camera:THREE.Camera,m:TapMob)=>{
  const p=new THREE.Vector3(m.x,m.y+.85,m.z).project(camera);
  return {tapX:(p.x+1)*200,tapY:(1-p.y)*200};
};
const get=(extras:Partial<Parameters<typeof selectMobNearScreenTap>[0]>={})=>{
  const c=camera(),pos=coords(c,mob);
  return {mobs:[mob],camera:c,...pos,canvasWidth:400,canvasHeight:400,
          playerX:0,playerZ:0,touch:true,...extras};
};
describe('small target click/touch selection',()=>{
  it('selects a small mob only near its visible projected body',()=>{
    const a=get();
    expect(selectMobNearScreenTap(a)).toBe('small');
    expect(selectMobNearScreenTap({...a,tapX:a.tapX+23})).toBe('small');
    expect(selectMobNearScreenTap({...a,tapX:a.tapX+27})).toBeNull();
    expect(selectMobNearScreenTap({...a,touch:false,tapX:a.tapX+14})).toBeNull();
  });
  it('never targets dead, far, invalid or off-screen mobs',()=>{
    for(const m of [{...mob,hp:0},{...mob,x:30},{...mob,x:Number.NaN}]){
      expect(selectMobNearScreenTap(get({mobs:[m]}))).toBeNull();
    }
    const a=get();
    expect(selectMobNearScreenTap({...a,tapX:-1})).toBeNull();
    expect(selectMobNearScreenTap({...a,canvasWidth:0})).toBeNull();
    expect(selectMobNearScreenTap({...a,mobs:[{...mob,z:140}]})).toBeNull();
  });
  it('chooses nearest visible target rather than list order',()=>{
    const a=get();
    const near={...mob,id:'near'},other={...mob,id:'other',x:1};
    const tap=coords(a.camera,other);
    expect(selectMobNearScreenTap({...a,mobs:[near,other],...tap})).toBe('other');
  });
});
