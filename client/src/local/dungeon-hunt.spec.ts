import {describe,it,expect} from 'vitest';
import {LocalGameSession,newSave} from './session';
import {AutoHuntController} from './auto-hunt';
import {dungeonWaveDone} from './first-dungeon';
describe('dungeon hunt waits for explicit progression',()=>{
 it('clears the original first wave through real combat, then stops without advancing or claiming',()=>{
  const save=newSave('구역 사냥',0);save.player.quest={stage:3,progress:0};const s=new LocalGameSession(save);s.dispatch({type:'enter-dungeon'});const a=new AutoHuntController(s,()=>{});a.configure({priority:'nearest',potionThreshold:.65});a.setEnabled(true);
  for(let i=0;i<4000&&!dungeonWaveDone(s.state.player.dungeon!);i++){a.tick(.05);s.tick(.05);}
  expect(s.state.player.dungeon).toMatchObject({inside:true,wave:0,kills:2,clears:0});a.tick(.05);expect(a.enabled).toBe(false);expect(a.stopReason).toBe('dungeon-ready');expect(a.retaliateOnHit).toBe(false);expect(s.state.player.dungeon!.wave).toBe(0);
  s.dispatch({type:'advance-dungeon'});expect(s.state.player.dungeon!.wave).toBe(1);expect(a.enabled).toBe(false);
 });
 it('does not consume a potion or grant rewards after a completed checkpoint',()=>{
  const save=newSave('완료 구역',0);save.player.quest={stage:3,progress:0};save.player.dungeon={inside:true,wave:0,kills:2,clears:0};save.player.hp=50;const s=new LocalGameSession(save),a=new AutoHuntController(s,()=>{});const before={gold:s.state.player.gold,potions:s.state.player.potions};a.configure({potionThreshold:.65});a.setEnabled(true);a.tick(.05);expect(a.stopReason).toBe('dungeon-ready');expect({gold:s.state.player.gold,potions:s.state.player.potions}).toEqual(before);expect(s.state.player.dungeon!.clears).toBe(0);
 });
});
