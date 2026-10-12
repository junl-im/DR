import * as THREE from 'three';
import {describe,it,expect,vi} from 'vitest';
import {createContactMark,disposeContactMark} from './contact-mark';
describe('ground contact cue',()=>{
  it('is cheap and noninteractive, disposed only on avatar teardown',()=>{
    const avatar=new THREE.Group(),disk=createContactMark();
    avatar.add(disk);
    expect(disk.name).toBe('character-ground-contact');
    expect(disk.userData['decorative']).toBe(true);
    expect(disk.castShadow).toBe(false);
    expect(disk.material).toBeInstanceOf(THREE.MeshBasicMaterial);
    expect(disk.geometry).toBeInstanceOf(THREE.CircleGeometry);
    expect(new THREE.Raycaster().intersectObject(disk)).toEqual([]);
    const gd=vi.spyOn(disk.geometry,'dispose');
    const md=vi.spyOn(disk.material as THREE.Material,'dispose');
    disposeContactMark(disk);
    expect(avatar.children).not.toContain(disk);
    expect(gd).toHaveBeenCalledTimes(1);
    expect(md).toHaveBeenCalledTimes(1);
  });
});
