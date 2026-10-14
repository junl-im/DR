import {readFileSync} from 'node:fs';

import {describe,it,expect} from 'vitest';
import {LocalGameSession,newSave} from './session';
import {resolveMobVisualEntry} from '../scene/mobs';
import {matchesQuestTarget} from './adventure-quests';
describe('field bestiary visuals preserve gameplay',()=>{
 it('gives 18 canonical spawns eight deterministic rigs without changing quests or saves',()=>{
  const first=new LocalGameSession(newSave('동물 도감',0));const restored=new LocalGameSession(first.snapshot());
  const models=first.mobs.map(m=>resolveMobVisualEntry(m.id,m.npcId)!.model);
  expect(first.mobs).toHaveLength(18);expect(new Set(models).size).toBe(8);
  expect(restored.mobs.map(m=>resolveMobVisualEntry(m.id,m.npcId)!.model)).toEqual(models);
  expect(first.mobs.filter(m=>matchesQuestTarget(m,'slime'))).toHaveLength(6);
  expect(first.mobs.filter(m=>matchesQuestTarget(m,'wanderer'))).toHaveLength(11);
  expect(first.mobs.filter(m=>matchesQuestTarget(m,'sentinel'))).toHaveLength(1);
  for(const mob of first.mobs){const entry=resolveMobVisualEntry(mob.id,mob.npcId)!;expect(entry.clipMap.idle).toBeTruthy();expect(entry.clipMap.attack).toBeTruthy();expect(mob.maxHp).toBe(mob.id==='local-11'?120:45);}
  for(const model of new Set(models)){
   const mob=first.mobs.find(m=>resolveMobVisualEntry(m.id,m.npcId)!.model===model)!;
   const entry=resolveMobVisualEntry(mob.id,mob.npcId)!;
   const bytes=readFileSync(new URL('../../public'+model,import.meta.url));
   const glb=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)));
   const clips=glb.animations.map((a:{name:string})=>a.name);
   for(const clip of Object.values(entry.clipMap))expect(clips).toContain(clip);
   expect(glb.meshes.length).toBeGreaterThan(0);expect(glb.skins.length).toBeGreaterThan(0);
  }
  expect(first.snapshot().schemaVersion).toBe(1);
 });
 it('does not remap unrelated online IDs, unknown or mismatched NPCs',()=>{
  expect(resolveMobVisualEntry('online-11',20003)!.model).toContain('Goblin.glb');
  expect(resolveMobVisualEntry('local-999',20003)!.model).toContain('Goblin.glb');
  expect(resolveMobVisualEntry('local-11',20001)!.model).toContain('Gremlin.glb');
  expect(resolveMobVisualEntry('local-11',99999)).toBeNull();
 });
});
