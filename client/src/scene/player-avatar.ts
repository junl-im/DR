import * as THREE from 'three';
import {
  EntityAction,
  createAnimState,
  stepAnimation,
  type AnimationClip,
  type AnimState,
} from '@nj/game-core';
import { createMeshCharacter, type MeshCharacter } from './creature/mesh-character';
import { createContactMark, disposeContactMark } from './contact-mark';
import { prepareModularArmor, ARMOR_SLOTS, type ArmorSelection, type ArmorOutfit, type ModularArmorController } from './creature/modular-armor';
import { type PlayerManifestEntry, getPlayerManifestEntry } from './creature/player-manifest';
import { createNameplate, type Nameplate } from './nameplate';
import { getGameState } from '../test-hook';
import {
  createWeaponVisualState,
  disposeWeaponVisual,
  syncWeaponVisual,
  type WeaponVisualState,
} from './creature/weapon-visual';

/** Min server-step displacement (per sync) that counts as movement. */
const MOVE_THRESHOLD = 0.02;
const MOVE_COAST_MS = 200;

export interface PlayerAvatarSync {
  x: number;
  y: number;
  z: number;
  action?: EntityAction;
  actionSeq?: number;
  equippedWeaponItemId?: number;
  armorEquipped?: ArmorSelection;
}

export interface PlayerAvatar {
  group: THREE.Group;
  sync: (p: PlayerAvatarSync, nowMs?: number) => void;
  update: (dt: number, nowMs?: number) => AnimationClip;
  /** Show/update the floating name label above the avatar's head. */
  setName: (name: string) => void;
  ready: Promise<void>;
  dispose: () => void;
}

function yawFromDirection(dx: number, dz: number): number {
  return Math.atan2(dx, dz);
}

export interface PlayerAvatarOptions {
  classId?: number;
  sex?: number;
  mesh?: MeshCharacter;
  manifest?: PlayerManifestEntry;
}

export function createPlayerAvatar(options: PlayerAvatarOptions = {}): PlayerAvatar {
  const group = new THREE.Group();
  group.name = 'player-avatar';
  const contactMark=createContactMark();
  group.add(contactMark);

  const classId = options.classId ?? 0;
  const entry = options.manifest ?? getPlayerManifestEntry(classId);
  const sexScale = options.sex === 1 ? 0.97 : 1.0;
  const feetOffsetY = entry.feetOffsetY;

  const placeholder = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.28, 0.75, 4, 8),
    new THREE.MeshLambertMaterial({ color: 0x4a7cff })
  );
  placeholder.name = 'player-placeholder';
  placeholder.position.y = 0.65;
  group.add(placeholder);

  const character =
    options.mesh ??
    createMeshCharacter(entry.model, {
      scale: entry.scale * sexScale,
      clipMap: entry.clipMap,
    });
  group.add(character.object);
  const weaponState: WeaponVisualState = createWeaponVisualState();
  let requestedWeaponId = 0;
  let requestedArmor: ArmorSelection = {helmet:'traveler',body:'traveler',gloves:'traveler',boots:'traveler'};
  let armorController: ModularArmorController | null = null;
  let disposed=false;
  const applyArmor = (): void => {
    if (!armorController) return;
    const current = armorController.snapshot();
    for (const slot of ARMOR_SLOTS) {
      if (current[slot] !== requestedArmor[slot]) armorController.setPart(slot,requestedArmor[slot]);
    }
  };
  const ready = character.ready
    .then(async () => {
      if(disposed)return;
      syncWeaponVisual(character.object, requestedWeaponId, weaponState);
      group.remove(placeholder);
      placeholder.geometry.dispose();
      (placeholder.material as THREE.Material).dispose();
      // Only V3 outfits share this rig; KayKit remains visually unchanged.
      const v3 = entry.model.match(/\/system-g6\/(knight|ranger|traveler)\.glb$/);
      if (v3) {
        try {
          armorController = await prepareModularArmor(character.object, undefined, v3[1] as ArmorOutfit);
          if(disposed){armorController.dispose?.();armorController=null;return;}
          applyArmor();
        } catch (error) {
          console.warn('optional modular armor visual could not load', error);
        }
      }
    })
    .catch(() => {
      /* mesh load failure is non-fatal for logic (e.g. unit tests with no server) */
    });

  let animState: AnimState = createAnimState();
  let prevX = 0;
  let prevZ = 0;
  let lastMoveMs = Number.NEGATIVE_INFINITY;
  let lastYaw = 0;
  let action = EntityAction.None;
  let actionSeq = 0;
  let initialized = false;
  let nameplate: Nameplate | null = null;
  const setName = (name: string): void => {
    const trimmed = (name ?? '').trim();
    if (!trimmed) return;
    if (!nameplate) {
      nameplate = createNameplate(trimmed);
      group.add(nameplate.sprite);
    } else {
      nameplate.setText(trimmed);
    }
  };

  const sync = (p: PlayerAvatarSync, nowMs = performance.now()): void => {
    if(disposed)return;
    if (!initialized) {
      prevX = p.x;
      prevZ = p.z;
      initialized = true;
    }

    const dx = p.x - prevX;
    const dz = p.z - prevZ;
    const delta = Math.hypot(dx, dz);

    if (delta > MOVE_THRESHOLD) {
      lastMoveMs = nowMs;
      lastYaw = yawFromDirection(dx, dz);
    }

    if (typeof p.action === 'number') action = p.action;
    if (typeof p.actionSeq === 'number') actionSeq = p.actionSeq;

    requestedWeaponId = p.equippedWeaponItemId ?? 0;
    requestedArmor = p.armorEquipped ?? {helmet:'traveler',body:'traveler',gloves:'traveler',boots:'traveler'};
    applyArmor();
    // Attachment must wait for the async GLB skeleton, not the placeholder.
    if (!group.children.includes(placeholder)) {
      syncWeaponVisual(character.object, requestedWeaponId, weaponState);
    }

    group.position.set(p.x, p.y - feetOffsetY, p.z);
    prevX = p.x;
    prevZ = p.z;
  };

  const update = (dt: number, nowMs = performance.now()): AnimationClip => {
    if(disposed)return 'idle';
    const locomotion: 'idle' | 'move' =
      nowMs - lastMoveMs <= MOVE_COAST_MS ? 'move' : 'idle';
    const stepped = stepAnimation(animState, { action, actionSeq, locomotion, nowMs });
    animState = stepped.state;
    const clip = stepped.clip;

    character.play(clip);
    character.update(dt);

    if (clip === 'attack' || clip === 'cast') {
      const state = getGameState();
      const mob = state.mobs.find((entry) => entry.id === state.targetMobId);
      if (mob) {
        lastYaw = yawFromDirection(mob.x - group.position.x, mob.z - group.position.z);
      }
    }

    group.rotation.y = lastYaw;
    return clip;
  };

  const dispose=():void=>{
    if(disposed)return;
    disposed=true;
    disposeWeaponVisual(weaponState);
    armorController?.dispose?.();
    armorController=null;
    disposeContactMark(contactMark);
    if(group.children.includes(placeholder)){
      group.remove(placeholder);
      placeholder.geometry.dispose();
      (placeholder.material as THREE.Material).dispose();
    }
  };
  return { group, sync, update, setName, ready, dispose };
}

export function computeFacingYaw(
  dx: number,
  dz: number,
  targetDx?: number,
  targetDz?: number,
  faceTarget = false
): number {
  if (faceTarget && targetDx !== undefined && targetDz !== undefined) {
    return yawFromDirection(targetDx, targetDz);
  }
  return yawFromDirection(dx, dz);
}

export { MOVE_THRESHOLD, MOVE_COAST_MS };
