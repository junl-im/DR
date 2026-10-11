import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface GlbJoint { name?: string }
interface GlbMesh { name?: string }
interface GlbDocument {
  nodes: GlbJoint[];
  meshes: GlbMesh[];
  skins: Array<{ joints: number[] }>;
  animations?: Array<{ name?: string }>;
}
const variants = {
  knight: ['human_male_heavy_armor', 'human_male_heavy_boots', 'human_male_heavy_gloves', 'human_male_heavy_helmet'],
  ranger: ['human_male_medium_armor', 'human_male_medium_boots', 'human_male_medium_gloves', 'human_male_medium_helmet'],
  traveler: ['human_male_light_armor_2', 'human_male_light_boots_2', 'human_male_hands_default'],
} as const;

function readGlb(name: keyof typeof variants): GlbDocument {
  const path = resolve(__dirname, '../../public/models/characters/system-g6', name + '.glb');
  const bytes = readFileSync(path);
  expect(bytes.toString('utf8', 0, 4)).toBe('glTF');
  expect(bytes.readUInt32LE(4)).toBe(2);
  const jsonLength = bytes.readUInt32LE(12);
  expect(bytes.toString('utf8', 16, 20)).toBe('JSON');
  expect(jsonLength).toBeGreaterThan(100);
  return JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength)) as GlbDocument;
}

describe('V3 character equipment source assets', () => {
  it('keeps the 43-joint skeleton names and order identical between outfits', () => {
    const skeletons = (Object.keys(variants) as Array<keyof typeof variants>).map(name => {
      const doc = readGlb(name);
      expect(doc.skins).toHaveLength(1);
      const bones = doc.skins[0].joints.map(id => doc.nodes[id].name);
      expect(bones).toHaveLength(43);
      expect(bones).toContain('palm_R');
      expect(bones).toContain('palm_L');
      return bones;
    });
    expect(skeletons[1]).toEqual(skeletons[0]);
    expect(skeletons[2]).toEqual(skeletons[0]);
  });

  it.each(Object.entries(variants))('%s contains documented armor parts and five clips', (name, required) => {
    const doc = readGlb(name as keyof typeof variants);
    const meshNames = doc.meshes.map(mesh => mesh.name);
    for (const part of required) expect(meshNames).toContain(part);
    expect(doc.animations?.map(clip => clip.name).sort()).toEqual(['Attack','Cast','Death','Idle','Run']);
  });
});
