import * as THREE from 'three';
import { loadGltfTemplate, type GLTFTemplate } from './mesh-character';

/** Preview-only clothing slots. Ownership, stats, and save files are untouched. */
export type ArmorSlot = 'helmet' | 'body' | 'gloves' | 'boots';
export type ArmorOutfit = 'traveler' | 'ranger' | 'knight';
export type ArmorSelection = Record<ArmorSlot, ArmorOutfit>;
export const ARMOR_SLOTS: readonly ArmorSlot[] = ['helmet', 'body', 'gloves', 'boots'];
export const ARMOR_OUTFITS: readonly ArmorOutfit[] = ['traveler', 'ranger', 'knight'];

const MODEL_ROOT = '/models/characters/system-g6/';
const PARTS: Record<ArmorOutfit, Record<ArmorSlot, string | null>> = {
  traveler: { helmet: null, body: 'human_male_light_armor_2',
    gloves: 'human_male_hands_default', boots: 'human_male_light_boots_2' },
  ranger: { helmet: 'human_male_medium_helmet', body: 'human_male_medium_armor',
    gloves: 'human_male_medium_gloves', boots: 'human_male_medium_boots' },
  knight: { helmet: 'human_male_heavy_helmet', body: 'human_male_heavy_armor',
    gloves: 'human_male_heavy_gloves', boots: 'human_male_heavy_boots' },
};

export interface ModularArmorController {
  setPart(slot: ArmorSlot, outfit: ArmorOutfit): void;
  reset(): void;
  snapshot(): ArmorSelection;
}

function findPart(root: THREE.Object3D, name: string): THREE.SkinnedMesh {
  const part = root.getObjectByName(name);
  if (!part || !(part instanceof THREE.SkinnedMesh)) {
    throw new Error('V3 armor component missing or not skinned: ' + name);
  }
  return part;
}

function assertCompatible(source: THREE.SkinnedMesh, target: THREE.SkinnedMesh): void {
  const a = source.skeleton, b = target.skeleton;
  if (a.bones.length !== 43 || a.bones.length !== b.bones.length) {
    throw new Error('V3 armor skeleton joint count mismatch');
  }
  for (let i = 0; i < a.bones.length; i++) {
    if (a.bones[i].name !== b.bones[i].name) {
      throw new Error('V3 armor skeleton joint name/order mismatch at ' + i);
    }
    const left = a.boneInverses[i].elements, right = b.boneInverses[i].elements;
    for (let j = 0; j < left.length; j++) {
      if (Math.abs(left[j] - right[j]) > 1e-4) {
        throw new Error('V3 armor inverse bind matrix mismatch at ' + i);
      }
    }
  }
  if (!source.bindMatrix.equals(target.bindMatrix)) {
    throw new Error('V3 armor bind pose transform mismatch');
  }
}

/** Adds individually skinned equipment meshes to an existing V3 traveler rig.
 * All 3 source files have identical 43 joint bind matrices; validate again
 * at runtime before reusing geometry to avoid silent skin deformation.
 * The target skeleton remains the *only* animated skeleton.
 */
export async function prepareModularArmor(
  travelerRoot: THREE.Object3D,
  load: (url: string) => Promise<GLTFTemplate> = loadGltfTemplate
): Promise<ModularArmorController> {
  const defaults = {
    body: findPart(travelerRoot, PARTS.traveler.body!),
    gloves: findPart(travelerRoot, PARTS.traveler.gloves!),
    boots: findPart(travelerRoot, PARTS.traveler.boots!),
  };
  const reference = defaults.body;
  const hair = findPart(travelerRoot, 'human_male_hair_1');
  const attachParent = reference.parent;
  if (!attachParent) throw new Error('V3 base armature parent missing');

  // Resolve and validate all sources before modifying the base character.
  const [ranger, knight] = await Promise.all([
    load(MODEL_ROOT + 'ranger.glb'),
    load(MODEL_ROOT + 'knight.glb'),
  ]);
  const sources: Record<'ranger' | 'knight', GLTFTemplate> = { ranger, knight };
  const prepared = new Map<string, THREE.SkinnedMesh>();

  for (const outfit of ['ranger', 'knight'] as const) {
    for (const slot of ARMOR_SLOTS) {
      const name = PARTS[outfit][slot]!;
      const source = findPart(sources[outfit].scene, name);
      assertCompatible(source, reference);
      // Share immutable geometry/material with the loaded template, but bind
      // its own renderable to the live traveler skeleton, never a second rig.
      const part = new THREE.SkinnedMesh(source.geometry, source.material);
      part.name = name + '-preview';
      part.position.copy(source.position);
      part.quaternion.copy(source.quaternion);
      part.scale.copy(source.scale);
      part.bindMode = reference.bindMode;
      part.bind(reference.skeleton, reference.bindMatrix.clone());
      part.castShadow = true;
      part.receiveShadow = true;
      part.frustumCulled = false;
      part.visible = false;
      prepared.set(outfit + ':' + slot, part);
    }
  }

  const defaultParts: Partial<Record<ArmorSlot, THREE.SkinnedMesh>> = defaults;
  const current: ArmorSelection = {
    helmet: 'traveler', body: 'traveler', gloves: 'traveler', boots: 'traveler',
  };
  for (const part of prepared.values()) attachParent.add(part);

  const setPart = (slot: ArmorSlot, outfit: ArmorOutfit): void => {
    if (!ARMOR_SLOTS.includes(slot) || !ARMOR_OUTFITS.includes(outfit)) {
      throw new Error('Unknown V3 outfit or slot');
    }
    current[slot] = outfit;
    const fallback = defaultParts[slot];
    if (fallback) fallback.visible = outfit === 'traveler';
    for (const candidate of ['ranger', 'knight'] as const) {
      const part = prepared.get(candidate + ':' + slot)!;
      part.visible = candidate === outfit;
    }
    // No bare-hair clipping through helmets; normal head/face stays visible.
    if (slot === 'helmet') hair.visible = outfit === 'traveler';
  };
  return {
    setPart,
    reset: () => { for (const slot of ARMOR_SLOTS) setPart(slot, 'traveler'); },
    snapshot: () => ({ ...current }),
  };
}
