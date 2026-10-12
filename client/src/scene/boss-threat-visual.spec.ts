import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {createBossThreatVisual} from './boss-threat-visual';
describe('ground-matched boss threat indicator',()=>{
  it('reuses one noninteractive ring across changing attacks and cleans up',()=>{
    const scene=new THREE.Scene();
    const visual=createBossThreatVisual(scene);
    const ring=visual.group.getObjectByName('danger-ring') as THREE.Mesh;
    expect(ring).toBeDefined();
    expect(visual.group.visible).toBe(false);
    const a={name:'보스',move:'aimed-strike' as const,x:13,z:-14,seconds:1.2,radius:2.3};
    visual.update(a);
    expect(visual.group.visible).toBe(true);
    expect(visual.group.position.x).toBe(13);
    expect(ring.scale.x).toBe(2.3);
    const ray=new THREE.Raycaster();
    expect(ray.intersectObject(ring)).toEqual([]);
    visual.update({...a,move:'ground-sweep',radius:5.5,seconds:.2});
    expect(visual.group.children[0]).toBe(ring);
    expect(ring.scale.y).toBe(5.5);
    visual.update(null);
    expect(visual.group.visible).toBe(false);
    visual.dispose();
    expect(scene.getObjectByName('dungeon-boss-telegraph')).toBeUndefined();
  });
});
