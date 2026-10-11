import * as THREE from 'three';
import { loadGltfTemplate, type GLTFTemplate } from './mesh-character';

/** Preview-only armor slots. No ownership, statistics or save changes. */
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

interface FoundPart {
  node: THREE.Object3D;
  meshes: THREE.SkinnedMesh[];
}

/** A multi-primitive glTF mesh may load as a Group of SkinnedMeshes
 * (real System G6 medium armor has two primitives).
 */
function findPart(root: THREE.Object3D, name: string): FoundPart {
  const node = root.getObjectByName(name);
  if (!node) throw new Error('V3 armor component missing: ' + name);
  const meshes: THREE.SkinnedMesh[] = [];
  node.traverse(child => {
    if (child instanceof THREE.SkinnedMesh) meshes.push(child);
  });
  if (meshes.length === 0) {
    throw new Error('V3 armor component contains no skinned meshes: ' + name);
  }
  return { node, meshes };
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

/** Copies a part's node hierarchy but rebinds every render mesh to one
 * animated target rig. Models with multiple glTF primitives are preserved.
 */
function createBoundPart(source: THREE.Object3D, rig: THREE.SkinnedMesh): THREE.Group {
  const bound = new THREE.Group();
  bound.name = source.name + '-preview';
  const copy = (node: THREE.Object3D): THREE.Object3D => {
    let result: THREE.Object3D;
    if (node instanceof THREE.SkinnedMesh) {
      const mesh = new THREE.SkinnedMesh(node.geometry, node.material);
      mesh.bindMode = rig.bindMode;
      mesh.bind(rig.skeleton, rig.bindMatrix.clone());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      result = mesh;
    } else {
      result = new THREE.Group();
    }
    result.name = node.name;
    result.position.copy(node.position);
    result.quaternion.copy(node.quaternion);
    result.scale.copy(node.scale);
    for (const child of node.children) {
      // Skeleton is supplied by the active traveler rig; no duplicated bone tree.
      if (!(child instanceof THREE.Bone)) result.add(copy(child));
    }
    return result;
  };
  bound.add(copy(source));
  bound.visible = false;
  return bound;
}

/** Adds per-slot skinned armor parts to an existing V3 traveler avatar.
 * The target skeleton remains the only animated skeleton. Share source
 * geometries/materials without mutating either template or save state.
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
  const reference = defaults.body.meshes[0];
  const hair = findPart(travelerRoot, 'human_male_hair_1').node;
  const attachParent = defaults.body.node.parent;
  if (!attachParent) throw new Error('V3 base armature parent missing');

  // Reject incompatible files before changing the live character.
  const [ranger, knight] = await Promise.all([
    load(MODEL_ROOT + 'ranger.glb'),
    load(MODEL_ROOT + 'knight.glb'),
  ]);
  const sources = { ranger, knight };
  const prepared = new Map<string, THREE.Group>();
  for (const outfit of ['ranger', 'knight'] as const) {
    for (const slot of ARMOR_SLOTS) {
      const component = findPart(sources[outfit].scene, PARTS[outfit][slot]!);
      for (const mesh of component.meshes) assertCompatible(mesh, reference);
      prepared.set(outfit + ':' + slot, createBoundPart(component.node, reference));
    }
  }
  for (const part of prepared.values()) attachParent.add(part);

  const defaultParts: Partial<Record<ArmorSlot, THREE.Object3D>> = {
    body: defaults.body.node, gloves: defaults.gloves.node, boots: defaults.boots.node,
  };
  const current: ArmorSelection = {
    helmet: 'traveler', body: 'traveler', gloves: 'traveler', boots: 'traveler',
  };
  const setPart = (slot: ArmorSlot, outfit: ArmorOutfit): void => {
    if (!ARMOR_SLOTS.includes(slot) || !ARMOR_OUTFITS.includes(outfit)) {
      throw new Error('Unknown V3 outfit or slot');
    }
    current[slot] = outfit;
    const baseline = defaultParts[slot];
    if (baseline) baseline.visible = outfit === 'traveler';
    for (const variant of ['ranger', 'knight'] as const) {
      prepared.get(variant + ':' + slot)!.visible = variant === outfit;
    }
    if (slot === 'helmet') hair.visible = outfit === 'traveler';
  };
  return {
    setPart,
    reset: () => { for (const slot of ARMOR_SLOTS) setPart(slot, 'traveler'); },
    snapshot: () => ({ ...current }),
  };
}
