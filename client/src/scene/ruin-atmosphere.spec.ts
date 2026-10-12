import * as THREE from 'three';
import {describe,it,expect} from 'vitest';
import {createRuinAtmosphere} from './ruin-atmosphere';
describe('v0.9 localized dungeon lighting',()=>{
  it.each([[true,1],[false,2]] as const)('has fixed torch budget on mobile=%s', (mobile,count)=>{
    const scene=new THREE.Scene(),atmosphere=createRuinAtmosphere(scene,mobile);
    let lights:THREE.PointLight[]=[];
    atmosphere.root.traverse(o=>{if(o instanceof THREE.PointLight)lights.push(o);});
    expect(lights).toHaveLength(count);
    expect(atmosphere.lightCount).toBe(count);
    expect(atmosphere.active).toBe(false);
    expect(atmosphere.root.visible).toBe(false);
    expect(lights.every(l=>l.intensity===0&&!l.castShadow)).toBe(true);
    atmosphere.setActive(true);
    expect(atmosphere.root.visible).toBe(true);
    expect(lights.every(l=>l.intensity>0)).toBe(true);
    const ray=new THREE.Raycaster();
    atmosphere.root.traverse(o=>{
      if(o instanceof THREE.Mesh) {
        expect(o.userData['decorative']).toBe(true);
        expect(ray.intersectObject(o)).toEqual([]);
      }
    });
    atmosphere.setActive(false);
    expect(lights.every(l=>l.intensity===0)).toBe(true);
    atmosphere.dispose();
    expect(scene.children).not.toContain(atmosphere.root);
  });
});
