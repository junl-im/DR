import {describe,expect,it} from 'vitest';
import * as THREE from 'three';
import {makePavingPixels,createVillagePaving,TOWN_PAVING_PIXELS} from './town-floor';
describe('village stone paving',()=>{
  it('reproduces the same opaque pixel field from fixed seed',()=>{
    const a=makePavingPixels(44),b=makePavingPixels(44),c=makePavingPixels(55);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    expect(a.length).toBe(TOWN_PAVING_PIXELS*TOWN_PAVING_PIXELS*4);
    expect(a.every((v,i)=>i%4!==3||v===255)).toBe(true);
  });
  it('keeps original ground footprint and raycast-independent decoration flag',()=>{
    const mesh=createVillagePaving({kind:'ground',x:0,y:2,z:0,width:40,depth:40,height:.1,color:0xc2b280});
    expect(mesh.name).toBe('village-ground');
    expect(mesh.userData['decorative']).toBe(true);
    expect(mesh.position.y).toBe(2);
    expect(mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
    expect((mesh.material as THREE.MeshStandardMaterial).map?.wrapS).toBe(THREE.RepeatWrapping);
    expect(mesh.castShadow).toBe(false);
    expect(mesh.receiveShadow).toBe(true);
  });
});
