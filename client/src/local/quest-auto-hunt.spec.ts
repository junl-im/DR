import {describe,it,expect} from 'vitest';
import {AutoHuntController} from './auto-hunt';
import {LocalGameSession,newSave} from './session';
import {matchesQuestTarget} from './adventure-quests';

function setup(){
 const s=new LocalGameSession(newSave('의뢰 사냥 검사',0));
 s.state.player.x=34;s.state.player.z=-24;
 return {s,auto:new AutoHuntController(s,()=>{})};
}
describe('Quest-directed hunting',()=>{
 it('ignores a closer unrelated mob and existing target, selecting only the active objective',()=>{
  const {s,auto}=setup();const slime=s.mobs.find(m=>m.npcId===20001)!;
  const other=s.mobs.find(m=>m.npcId!==20001&&m.name!=='숲의 정예 감시자')!;
  for(const m of s.mobs)m.hp=0;
  Object.assign(slime,{hp:slime.maxHp,x:40,z:-24});Object.assign(other,{hp:other.maxHp,x:35,z:-24});
  s.dispatch({type:'target',id:other.id});auto.configure({priority:'quest'});auto.setEnabled(true);auto.tick();
  expect(s.target).toBe(slime.id);expect(slime.hp).toBe(slime.maxHp);expect(auto.activity).toBe('hunting');
 });
 it('selects an elite only for the explicit sentinel quest and never a dungeon creature',()=>{
  const {s,auto}=setup();s.state.player.quest={stage:2,progress:0};
  const sentinel=s.mobs.find(m=>m.name==='숲의 정예 감시자')!;
  Object.assign(sentinel,{x:36,z:-24});auto.configure({priority:'quest'});auto.setEnabled(true);auto.tick();
  expect(s.target).toBe(sentinel.id);
  expect(matchesQuestTarget({...sentinel,id:'dungeon-2-0'},'sentinel')).toBe(false);
  expect(matchesQuestTarget(sentinel,'wanderer')).toBe(false);
 });
 it('stops immediately on objective completion before consuming an optional potion, without auto-claiming',()=>{
  const {s,auto}=setup();s.state.player.quest={stage:0,progress:3};s.state.player.hp=50;
  const before=s.snapshot();auto.configure({priority:'quest',potionThreshold:.65});auto.setEnabled(true);auto.tick();
  expect(auto.enabled).toBe(false);expect(auto.stopReason).toBe('quest-ready');
  expect(s.state.player.quest).toEqual(before.player.quest);expect(s.state.player.gold).toBe(before.player.gold);
  expect(s.state.player.potions).toBe(before.player.potions);expect(s.attacking).toBe(false);
 });
 it('uses real combat for the final kill, stops next tick and awards no duplicate quest reward',()=>{
  const {s,auto}=setup();const m=s.mobs.find(m=>m.npcId===20001)!;
  for(const other of s.mobs)other.hp=0;
  m.hp=1;s.state.player.x=m.x-1;s.state.player.z=m.z;s.state.player.quest={stage:0,progress:2};
  auto.configure({priority:'quest'});auto.setEnabled(true);
  for(let i=0;i<200&&auto.enabled;i++){auto.tick(.05);s.tick(.05);}
  expect(s.state.player.kills).toBe(1);expect(s.state.player.quest).toEqual({stage:0,progress:3});
  expect(auto.stopReason).toBe('quest-ready');const gold=s.state.player.gold;
  for(let i=0;i<50;i++){auto.tick(.05);s.tick(.05);}
  expect(s.state.player.kills).toBe(1);expect(s.state.player.gold).toBe(gold);
 });
 it('waits for an eligible respawn without switching species; all quests complete and dungeon mode stop safely',()=>{
  const {s,auto}=setup();for(const m of s.mobs)if(m.npcId===20001)m.hp=0;
  auto.configure({priority:'quest'});auto.setEnabled(true);auto.tick();expect(auto.activity).toBe('waiting');expect(s.attacking).toBe(false);
  s.state.player.quest={stage:3,progress:0};auto.tick();expect(auto.stopReason).toBe('quest-complete');
  s.state.player.dungeon!.inside=true;auto.setEnabled(true);auto.tick();expect(auto.stopReason).toBe('quest-unavailable');
 });
});
