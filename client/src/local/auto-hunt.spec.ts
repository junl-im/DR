import {describe,expect,it} from 'vitest';
import {LocalGameSession,newSave} from './session';
import {AutoHuntController,nextTabTarget,selectableMobs} from './auto-hunt';

function setup(){
 const s=new LocalGameSession(newSave('테스터',0));
 s.state.player.x=34;s.state.player.z=-24;
 const mobs=s.mobs.filter(m=>m.hp>0&&!m.id.startsWith('dungeon-'));
 return {s,mobs};
}
describe('Tab target and local auto hunt',()=>{
 it('cycles nearest living mobs, never targeting the wrong zone or a defeated mob',()=>{
  const {s,mobs}=setup();
  expect(mobs.length).toBeGreaterThan(2);
  const list=selectableMobs(s);
  expect(list.length).toBeGreaterThan(1);
  const first=nextTabTarget(s);expect(first).toBe(list[0].id);
  s.dispatch({type:'target',id:first!});
  expect(nextTabTarget(s)).toBe(list[1].id);
  list[1].hp=0;
  expect(nextTabTarget(s)).not.toBe(list[1].id);
  for(const m of mobs)m.hp=0;
  expect(nextTabTarget(s)).toBeNull();
 });
 it('starts ordinary combat and reacquires a new living mob without giving free damage',()=>{
  const {s}=setup();
  const selected:string[]=[];
  const auto=new AutoHuntController(s,id=>{if(id)selected.push(id);});
  expect(auto.setEnabled(true)).toBe(true);
  auto.tick();
  expect(s.attacking).toBe(true);
  expect(selected.length).toBe(1);
  const first=s.mobs.find(m=>m.id===s.target)!;
  expect(first.hp).toBe(first.maxHp);
  first.hp=0;
  auto.tick();
  expect(s.target).not.toBe(first.id);
  expect(selected.length).toBe(2);
  auto.setEnabled(false);
  expect(s.attacking).toBe(false);
 });
 it('limits selection to an anchored 28m patrol and cancels when HP is critically low',()=>{
  const {s}=setup();
  const auto=new AutoHuntController(s,()=>{});
  auto.setEnabled(true);
  s.state.player.hp=20;
  auto.tick();
  expect(auto.enabled).toBe(false);
  expect(s.attacking).toBe(false);
  s.state.player.hp=100;
  auto.setEnabled(true);
  s.state.player.x+=29;
  auto.tick();
  expect(auto.enabled).toBe(false);
 });
 it('rejects unknown presets and accepts configurable radius, priority and potion choices',()=>{
  const {s}=setup();
  const auto=new AutoHuntController(s,()=>{});
  expect(()=>auto.configure({radius:1})).toThrow(RangeError);
  expect(()=>auto.configure({potionThreshold:.999})).toThrow(RangeError);
  expect(()=>auto.configure({priority:'unknown' as never})).toThrow(RangeError);
  auto.configure({radius:12,priority:'weakest',potionThreshold:.5});
  expect([auto.radius,auto.priority,auto.potionThreshold]).toEqual([12,'weakest',.5]);
  auto.configure({radius:20,priority:'normal-only',potionThreshold:0});
  expect([auto.radius,auto.priority,auto.potionThreshold]).toEqual([20,'normal-only',0]);
 });
 it('prefers wounded mobs by percentage and protects from elites in normal-only mode',()=>{
  const {s,mobs}=setup();
  for(const m of mobs){m.x=36;m.z=-24;}
  mobs[0].hp=mobs[0].maxHp;
  mobs[1].hp=Math.max(1,Math.floor(mobs[1].maxHp*.2));
  const auto=new AutoHuntController(s,()=>{});
  auto.configure({priority:'weakest'});
  auto.setEnabled(true);auto.tick();
  expect(s.target).toBe(mobs[1].id);
  auto.setEnabled(false);
  for(const m of mobs)m.hp=0;
  const elite=s.mobs.find(m=>m.name==='숲의 정예 감시자')!;
  elite.hp=elite.maxHp;elite.x=36;elite.z=-24;
  auto.configure({priority:'normal-only'});
  auto.setEnabled(true);auto.tick();
  expect(s.attacking).toBe(false);
  expect(s.target).not.toBe(elite.id);
  auto.configure({priority:'nearest'});
  auto.tick();
  expect(s.target).toBe(elite.id);
 });
 it('leaves potions untouched by default and consumes at most once every 5 seconds if opted in',()=>{
  const {s}=setup();
  s.state.player.hp=42;s.state.player.potions=3;
  const auto=new AutoHuntController(s,()=>{});
  auto.setEnabled(true);auto.tick();
  expect(s.state.player.potions).toBe(3);
  auto.configure({potionThreshold:.5});
  auto.tick();
  expect(s.state.player.potions).toBe(2);
  expect(s.state.player.hp).toBe(97);
  s.state.player.hp=40;
  auto.setEnabled(false);auto.setEnabled(true); // must not reset consumable cooldown
  auto.tick();
  expect(s.state.player.potions).toBe(2);
  for(let i=0;i<105;i++)auto.tick();
  expect(s.state.player.potions).toBe(1);
  expect(s.state.player.hp).toBe(95);
 });
 it('stops if the play zone changes, never entering another dungeon wave automatically',()=>{
  const {s}=setup();
  const auto=new AutoHuntController(s,()=>{});
  auto.setEnabled(true);auto.tick();
  s.state.player.dungeon!.inside=true;
  auto.tick();
  expect(auto.enabled).toBe(false);
  expect(auto.stopReason).toBe('zone-change');
  expect(s.attacking).toBe(false);
 });
 it('honors shortened patrol boundaries and protects critical health before using potions',()=>{
  const {s}=setup();
  const auto=new AutoHuntController(s,()=>{});
  auto.configure({radius:12,potionThreshold:.5});
  auto.setEnabled(true);
  s.state.player.x+=13;
  auto.tick();
  expect(auto.enabled).toBe(false);
  expect(auto.stopReason).toBe('range');
  s.state.player.x-=13;
  auto.setEnabled(true);
  s.state.player.hp=10;
  auto.tick();
  expect(auto.enabled).toBe(false);
  expect(auto.stopReason).toBe('low-hp');
  expect(s.state.player.potions).toBe(5);
 });
 it('stopping a hunting chase also clears the pending movement path',()=>{
  const save=newSave('path control',0);
  save.player.x=34;save.player.z=-24;
  const s=new LocalGameSession(save);
  const auto=new AutoHuntController(s,()=>{});
  auto.setEnabled(true);
  auto.tick();
  s.tick(.05);
  const x=s.state.player.x,z=s.state.player.z;
  auto.setEnabled(false);
  for(let i=0;i<4;i++)s.tick(.05);
  expect(s.state.player.x).toBeCloseTo(x,5);
  expect(s.state.player.z).toBeCloseTo(z,5);
  expect(s.attacking).toBe(false);
 });
 it('has no effect on persisted schema and stops all attacks when disabled',()=>{
  const {s}=setup();
  const original=s.snapshot().schemaVersion;
  const auto=new AutoHuntController(s,()=>{});
  auto.setEnabled(true);auto.tick();
  auto.setEnabled(false);
  expect(s.attacking).toBe(false);
  expect(s.snapshot().schemaVersion).toBe(original);
  expect(s.snapshot()).not.toHaveProperty('autoHunt');
 });
});
