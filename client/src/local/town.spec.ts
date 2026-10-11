import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildTownDetails, TOWN_SIGNS } from './town';

describe('town dressing', () => {
  it('keeps all original interaction markers while adding detailed sign meshes', () => {
    const scene = new THREE.Scene();
    buildTownDetails(scene);
    const details = scene.getObjectByName('dungeon-zero-town-details');
    expect(details).toBeDefined();
    for(const sign of TOWN_SIGNS) {
      const marker = details?.getObjectByName('town-sign-' + sign.id);
      expect(marker).toBeDefined();
      expect(marker?.position.x).toBe(sign.x);
      expect(marker?.position.z).toBe(sign.z);
      expect(marker?.children.length).toBeGreaterThan(4);
    }
    expect(details?.getObjectByName('town-edge-foliage')).toBeInstanceOf(THREE.InstancedMesh);
  });

  it('creates at most two unshadowed accent lights and is idempotent', () => {
    const scene = new THREE.Scene();
    buildTownDetails(scene);
    buildTownDetails(scene);
    const details=scene.getObjectByName('dungeon-zero-town-details')!;
    const lights: THREE.PointLight[] = [];
    details.traverse(node => { if(node instanceof THREE.PointLight) lights.push(node); });
    expect(lights).toHaveLength(2);
    expect(lights.every(light => !light.castShadow)).toBe(true);
    expect(scene.children.filter(node => node.name === details.name)).toHaveLength(1);
  });
});
