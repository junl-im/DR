import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  ARMOR_SLOTS, prepareModularArmor, type ArmorOutfit,
} from './modular-armor';
import type { GLTFTemplate } from './mesh-character';

const names = Array.from({ length: 43 }, (_, i) =>
  i === 0 ? 'root' : i === 32 ? 'palm_R' : 'joint_' + i
);
const nameByOutfit = {
  traveler: ['human_male_hair_1', 'human_male_hands_default', 'human_male_head_default',
    'human_male_light_armor_2', 'human_male_light_boots_2'],
  ranger: ['human_male_head_default','human_male_medium_armor','human_male_medium_boots',
    'human_male_medium_gloves','human_male_medium_helmet'],
  knight: ['human_male_head_default','human_male_heavy_armor','human_male_heavy_boots',
    'human_male_heavy_gloves','human_male_heavy_helmet'],
};

function buildRig(outfit: ArmorOutfit, mismatch = false): THREE.Group {
  const group = new THREE.Group();
  const bones = names.map((name, i) => {
    const bone = new THREE.Bone();
    bone.name = mismatch && i === 20 ? 'incompatible_bone' : name;
    return bone;
  });
  const skeleton = new THREE.Skeleton(bones);
  for (const name of nameByOutfit[outfit]) {
    const primitive = (partName: string) => {
      const mesh = new THREE.SkinnedMesh(
        new THREE.BoxGeometry(0.2, 0.2, 0.2),
        new THREE.MeshBasicMaterial()
      );
      mesh.name = partName;
      mesh.bind(skeleton, new THREE.Matrix4());
      return mesh;
    };
    if (outfit === 'ranger' && name === 'human_male_medium_armor') {
      // Source GLB uses a Group containing two skinned primitives.
      const multi = new THREE.Group();
      multi.name = name;
      multi.add(primitive('medium-armor-primitive-0'), primitive('medium-armor-primitive-1'));
      group.add(multi);
    } else {
      group.add(primitive(name));
    }
  }
  return group;
}
const source = (root: THREE.Group): GLTFTemplate => ({ scene: root, animations: [] });

describe('four-slot modular armor visual fitting', () => {
  it('mixes individual skinned parts on the existing traveler skeleton', async () => {
    const traveler = buildRig('traveler');
    const load = async (url: string) => source(buildRig(url.includes('ranger') ? 'ranger' : 'knight'));
    const ctrl = await prepareModularArmor(traveler, load);
    const base = traveler.getObjectByName('human_male_light_armor_2') as THREE.SkinnedMesh;
    const hair = traveler.getObjectByName('human_male_hair_1') as THREE.SkinnedMesh;

    ctrl.setPart('helmet', 'knight');
    ctrl.setPart('body', 'ranger');
    ctrl.setPart('gloves', 'knight');
    ctrl.setPart('boots', 'traveler');

    expect(ctrl.snapshot()).toEqual({helmet:'knight',body:'ranger',gloves:'knight',boots:'traveler'});
    expect(hair.visible).toBe(false);
    expect(base.visible).toBe(false);
    const helmet = traveler.getObjectByName('human_male_heavy_helmet-preview') as THREE.Group;
    const armor = traveler.getObjectByName('human_male_medium_armor-preview') as THREE.Group;
    expect(helmet.visible).toBe(true);
    expect(armor.visible).toBe(true);
    const armorSkins: THREE.SkinnedMesh[] = [];
    armor.traverse(node => { if(node instanceof THREE.SkinnedMesh) armorSkins.push(node); });
    expect(armorSkins).toHaveLength(2);
    expect(traveler.getObjectByName('human_male_heavy_gloves-preview')?.visible).toBe(true);
    expect(traveler.getObjectByName('human_male_heavy_boots-preview')?.visible).toBe(false);
    helmet.traverse(node => {
      if (node instanceof THREE.SkinnedMesh) expect(node.skeleton).toBe(base.skeleton);
    });
    for(const skin of armorSkins) expect(skin.skeleton).toBe(base.skeleton);
    expect(ARMOR_SLOTS).toHaveLength(4);

    ctrl.reset();
    expect(ctrl.snapshot()).toEqual({helmet:'traveler',body:'traveler',gloves:'traveler',boots:'traveler'});
    expect(hair.visible).toBe(true);
    expect(base.visible).toBe(true);
    expect(helmet.visible).toBe(false);
  });


  it.each(['ranger','knight'] as ArmorOutfit[])('supports %s as the chosen source avatar',async (base)=>{
    const character=buildRig(base);
    const originalHelmet=character.getObjectByName(base==='knight'?'human_male_heavy_helmet':'human_male_medium_helmet')!;
    const ctrl=await prepareModularArmor(character,async url=>
      source(buildRig(url.includes('ranger')?'ranger':url.includes('knight')?'knight':'traveler')),base
    );
    ctrl.setPart('helmet','traveler');
    expect(originalHelmet.visible).toBe(false);
    ctrl.setPart('body','ranger');
    expect(ctrl.snapshot().body).toBe('ranger');
    expect(character.getObjectByName('human_male_medium_armor-preview')?.visible ?? base==='ranger').toBe(true);
    ctrl.setPart('boots','knight');
    expect(ctrl.snapshot().boots).toBe('knight');
    ctrl.reset();
    expect(ctrl.snapshot()).toEqual({helmet:'traveler',body:'traveler',gloves:'traveler',boots:'traveler'});
  });

  it('does not attach incompatible outfit geometry', async () => {
    const traveler = buildRig('traveler');
    const before = traveler.children.length;
    await expect(prepareModularArmor(traveler, async url =>
      source(buildRig(url.includes('ranger') ? 'ranger' : 'knight', url.includes('knight')))
    )).rejects.toThrow('skeleton joint name/order mismatch');
    expect(traveler.children.length).toBe(before);
  });

  it('refuses invalid slots without changing snapshot', async () => {
    const traveler = buildRig('traveler');
    const ctrl = await prepareModularArmor(traveler, async url =>
      source(buildRig(url.includes('ranger') ? 'ranger' : 'knight'))
    );
    const prev = ctrl.snapshot();
    expect(() => ctrl.setPart('shield' as never, 'knight')).toThrow('Unknown');
    expect(ctrl.snapshot()).toEqual(prev);
  });
});
