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
