import {describe,expect,it} from 'vitest';
import * as THREE from 'three';
import {buildFirstDungeonArt} from './first-dungeon-art';
import {DUNGEON_ARENA,DUNGEON_GATE} from '../local/first-dungeon';
describe('licensed/procedural first-dungeon environment',()=>{
  it('renders the same portal and one 196-tile instanced ruin chamber without creating collisions',()=>{
    const scene=new THREE.Scene();
    const root=buildFirstDungeonArt(scene);
    expect(buildFirstDungeonArt(scene)).toBe(root);
    const gate=root.getObjectByName('ruin-entry-gate')!;
    expect(gate.position.x).toBe(DUNGEON_GATE.x);
    expect(gate.position.z).toBe(DUNGEON_GATE.z);
    const chamber=root.getObjectByName('ruin-arena-decoration')!;
    expect(chamber.position.x).toBe(DUNGEON_ARENA.x);
    expect(chamber.position.z).toBe(DUNGEON_ARENA.z);
    const tiles=root.getObjectByName('ruin-cracked-paving') as THREE.InstancedMesh;
    expect(tiles.count).toBe(196);
    // Instance colors and geometry provide low-cost visual variation without
    // extra draw calls or renderer-wide material mutations.
    expect(tiles.instanceColor).not.toBeNull();
    const aColor=new THREE.Color(),bColor=new THREE.Color();
    tiles.getColorAt(0,aColor);tiles.getColorAt(1,bColor);
    expect(aColor.equals(bColor)).toBe(false);
    expect(tiles.material).not.toBe((root.getObjectByName('ruin-entry-gate') as THREE.Group).children[0] instanceof THREE.Mesh ? ((root.getObjectByName('ruin-entry-gate') as THREE.Group).children[0] as THREE.Mesh).material : undefined);
    expect(tiles.userData['decorative']).toBe(true);
    expect(tiles.castShadow).toBe(false);
    expect(scene.children.filter(o=>o.name===root.name)).toHaveLength(1);
    let lights=0,decorationMeshes=0;
    root.traverse(o=>{if(o instanceof THREE.Light)lights++;if(o instanceof THREE.Mesh) {
      decorationMeshes++;expect(o.userData['decorative']).toBe(true);
    }});
    expect(lights).toBe(0);
    expect(decorationMeshes).toBeLessThan(25);
  });
});
