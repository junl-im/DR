import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { EntityAction } from '@nj/game-core';
import { countPowerStrikeVfx } from './power-strike-vfx';
import { createVfxManager } from './vfx-manager';

const basePlayer = {
  hp: 100,
  level: 1,
  action: EntityAction.None,
  actionSeq: 0,
  x: 0,
  y: 1,
  z: 0,
};

describe('vfx-manager', () => {
  let scene: THREE.Scene;

  beforeEach(() => {
    scene = new THREE.Scene();
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns zeroed hook snapshot initially', () => {
    const mgr = createVfxManager(scene);
    expect(mgr.getHookSnapshot()).toEqual({
      powerStrikeCount: 0,
      meleeHitCount: 0,
      levelUpCount: 0,
      targetRingVisible: false,
      activeEffectCount: 0,
    });
  });

  it('increments meleeHitCount when mob hp decreases', () => {
    const mgr = createVfxManager(scene);
    mgr.syncMob({
      id: 'mob-1',
      hp: 41,
      x: 2,
      y: 0,
      z: 0,
      action: EntityAction.None,
      actionSeq: 0,
    });
    mgr.syncMob({
      id: 'mob-1',
      hp: 24,
      x: 2,
      y: 0,
      z: 0,
      action: EntityAction.None,
      actionSeq: 0,
    });
    expect(mgr.getHookSnapshot().meleeHitCount).toBe(1);
  });

  it('increments meleeHitCount when player hp decreases', () => {
    const mgr = createVfxManager(scene);
    mgr.syncPlayer({ ...basePlayer, hp: 100 });
    mgr.syncPlayer({ ...basePlayer, hp: 80 });
    expect(mgr.getHookSnapshot().meleeHitCount).toBe(1);
  });

  it('increments powerStrikeCount on cast actionSeq bump with target', () => {
    const mgr = createVfxManager(scene);
    mgr.setTargetMobId('mob-1');
    mgr.syncMob({
      id: 'mob-1',
      hp: 50,
      x: 3,
      y: 0,
      z: 0,
      action: EntityAction.None,
      actionSeq: 0,
    });
    mgr.syncPlayer({ ...basePlayer });
    mgr.syncPlayer({
      ...basePlayer,
      action: EntityAction.Cast,
      actionSeq: 1,
    });
    expect(mgr.getHookSnapshot().powerStrikeCount).toBe(1);
  });

  it('increments levelUpCount when player level increases', () => {
    const mgr = createVfxManager(scene);
    mgr.syncPlayer({ ...basePlayer, level: 1 });
    mgr.syncPlayer({ ...basePlayer, level: 2 });
    expect(mgr.getHookSnapshot().levelUpCount).toBe(1);
  });

  it('tracks activeEffectCount for spawned timed VFX', () => {
    const mgr = createVfxManager(scene);
    mgr.setTargetMobId('mob-1');
    mgr.syncMob({
      id: 'mob-1',
      hp: 50,
      x: 2,
      y: 0,
      z: 0,
      action: EntityAction.None,
      actionSeq: 0,
    });
    mgr.syncPlayer({ ...basePlayer });
    mgr.syncPlayer({
      ...basePlayer,
      action: EntityAction.Cast,
      actionSeq: 1,
    });
    expect(mgr.getHookSnapshot().activeEffectCount).toBeGreaterThan(0);
    expect(countPowerStrikeVfx(scene)).toBeGreaterThan(0);
    mgr.tick(900);
    expect(mgr.getHookSnapshot().activeEffectCount).toBe(0);
    expect(countPowerStrikeVfx(scene)).toBe(0);
  });

  it('attachMobDissolve starts fading the mob render root', () => {
    const mgr = createVfxManager(scene);
    const mobGroup = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    mobGroup.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat));
    scene.add(mobGroup);

    mgr.attachMobDissolve('mob-1', mobGroup, 0);
    mgr.tick(600);

    const faded = (mobGroup.children[0] as THREE.Mesh).material as THREE.Material;
    expect(faded.opacity).toBeGreaterThanOrEqual(0.4);
    expect(faded.opacity).toBeLessThanOrEqual(0.6);
    expect(mat.opacity).toBe(1);
  });

  it('attachPlayerDissolve starts fading the player render root', () => {
    const mgr = createVfxManager(scene);
    const playerGroup = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    playerGroup.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat));
    scene.add(playerGroup);

    mgr.attachPlayerDissolve(playerGroup, 0);
    mgr.tick(600);

    const faded = (playerGroup.children[0] as THREE.Mesh).material as THREE.Material;
    expect(faded.opacity).toBeGreaterThanOrEqual(0.4);
    expect(faded.opacity).toBeLessThanOrEqual(0.6);
    expect(mat.opacity).toBe(1);
  });

  it('sets targetRingVisible when target mob is valid', () => {
    const mgr = createVfxManager(scene);
    mgr.syncMob({
      id: 'mob-1',
      hp: 50,
      x: 1,
      y: 0,
      z: 2,
      action: EntityAction.None,
      actionSeq: 0,
    });
    mgr.setTargetMobId('mob-1');
    expect(mgr.getHookSnapshot().targetRingVisible).toBe(true);
    mgr.setTargetMobId(null);
    expect(mgr.getHookSnapshot().targetRingVisible).toBe(false);
  });
});

describe('completed corpse cleanup',()=>{
  it('restores shared source bindings, disposes the private fade material and hides only the corpse',()=>{
    const scene=new THREE.Scene(),mgr=createVfxManager(scene);
    const source=new THREE.MeshLambertMaterial(),root=new THREE.Group();
    const corpse=new THREE.Mesh(new THREE.BoxGeometry(),source),living=corpse.clone();
    root.add(corpse);scene.add(root,living);mgr.attachMobDissolve('dead',root,0);
    let disposed=0;(corpse.material as THREE.Material).addEventListener('dispose',()=>disposed++);
    mgr.tick(1201);
    expect(root.visible).toBe(false);expect(living.visible).toBe(true);
    expect(corpse.material).toBe(source);expect(source.opacity).toBe(1);expect(disposed).toBe(1);
    mgr.dispose();expect(disposed).toBe(1);
  });
});
