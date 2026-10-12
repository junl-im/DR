import { describe,expect,it } from 'vitest';
import { LocalGameSession,newSave,validateSave } from './session';
import {DUNGEON_WAVES,DUNGEON_REWARD,validateDungeon,emptyDungeon} from './first-dungeon';

function clearedQuests() {const s=newSave('시험 모험가',0);s.player.quest={stage:3,progress:0};return s;}
function kill(session:LocalGameSession,id:string) {
  const mob=session.mobs.find(m=>m.id===id)!;
  expect(mob).toBeDefined();
  session.state.player.mp=60;
  mob.x=session.state.player.x+1; mob.z=session.state.player.z;
  mob.hp=1;
  session.dispatch({type:'target',id});
  session.dispatch({type:'skill'});
  for(let i=0;i<81;i++)session.tick(.05);
}
describe('the first dungeon — 3-wave saved instance',()=>{
  it('rejects impossible dungeon checkpoints; legacy saves remain empty',()=>{
    const old=clearedQuests();delete old.player.dungeon;
    expect(validateSave(old).player.dungeon).toEqual(emptyDungeon());
    for(const state of [{inside:true,wave:3,kills:0,clears:0},
      {inside:false,wave:1,kills:0,clears:0},
      {inside:true,wave:0,kills:3,clears:0},
      {inside:true,wave:1,kills:0,clears:-1},
      {inside:true,wave:0,kills:0,clears:0,admin:1}]){
      expect(()=>validateDungeon(state)).toThrow('던전');
    }
  });
  it('locks entrance until the three village quests are claimed',()=>{
    const session=new LocalGameSession(newSave('초보',0));
    session.dispatch({type:'enter-dungeon'});
    expect(session.state.player.dungeon?.inside).toBe(false);
    expect(session.mobs.some(m=>m.id.startsWith('dungeon-'))).toBe(false);
  });
  it('enters, progresses 3 waves, saves checkpoint and rewards once',()=>{
    const session=new LocalGameSession(clearedQuests());
    session.dispatch({type:'enter-dungeon'});
    expect(session.state.player.dungeon?.inside).toBe(true);
    expect(session.mobs.filter(m=>m.id.startsWith('dungeon-') && m.hp>0)).toHaveLength(2);
    session.dispatch({type:'claim-dungeon'});
    expect(session.state.player.dungeon?.clears).toBe(0);
    kill(session,'dungeon-0-0');
    const saved=validateSave(JSON.parse(JSON.stringify(session.snapshot())));
    expect(saved.player.dungeon).toMatchObject({inside:true,wave:0,kills:1});
    const restored=new LocalGameSession(saved);
    expect(restored.mobs.filter(m=>m.id.startsWith('dungeon-'))).toHaveLength(1);
    expect(restored.mobs.some(m=>m.id==='dungeon-0-0')).toBe(false);
    restored.dispatch({type:'advance-dungeon'});
    expect(restored.state.player.dungeon?.wave).toBe(0);
    kill(restored,'dungeon-0-1');
    restored.dispatch({type:'advance-dungeon'});
    expect(restored.state.player.dungeon?.wave).toBe(1);
    for(let i=0;i<2;i++)kill(restored,'dungeon-1-'+i);
    restored.dispatch({type:'advance-dungeon'});
    expect(restored.state.player.dungeon?.wave).toBe(2);
    expect(DUNGEON_WAVES).toHaveLength(3);
    kill(restored,'dungeon-2-0');
    const gold=restored.state.player.gold;
    restored.dispatch({type:'claim-dungeon'});
    expect(restored.state.player.dungeon).toEqual({inside:false,wave:0,kills:0,clears:1});
    expect(restored.state.player.gold).toBe(gold+DUNGEON_REWARD.gold);
    const twice=restored.state.player.gold;
    restored.dispatch({type:'claim-dungeon'});
    expect(restored.state.player.gold).toBe(twice);
    expect(restored.mobs.some(m=>m.id.startsWith('dungeon-'))).toBe(false);
  });
  it('recall abandons unclaimed rewards and does not retain dangling enemies',()=>{
    const s=new LocalGameSession(clearedQuests());
    s.dispatch({type:'enter-dungeon'});
    kill(s,'dungeon-0-0');
    const gold=s.state.player.gold;
    s.dispatch({type:'recall'});
    expect(s.state.player.dungeon).toEqual(emptyDungeon());
    expect(s.state.player.gold).toBe(gold);
    expect(s.mobs.filter(m=>m.id.startsWith('dungeon-'))).toHaveLength(0);
  });
});
