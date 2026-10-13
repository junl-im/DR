import {describe,it,expect} from 'vitest';
import {LocalGameSession,newSave} from './session';
import {AutoHuntController} from './auto-hunt';
import {matchesQuestTarget,questKillKind} from './adventure-quests';

describe('Quest hunt travel and exact kill verification',()=>{
  it('moves out of the village before enabling a normal safe 28m hunt',()=>{
    const s=new LocalGameSession(newSave('Guide',0));
    const a=new AutoHuntController(s,()=>{});
    expect(Math.hypot(s.state.player.x,s.state.player.z)).toBeLessThan(1);
    expect(a.startQuestHunt()).toBe(true);
    expect(a.approachingQuest).toBe(true);
    expect(a.enabled).toBe(false);
    let maxTravel=0;
    for(let i=0;i<900&&!a.enabled;i++){
      a.tick(.05);s.tick(.05);
      maxTravel=Math.max(maxTravel,Math.hypot(s.state.player.x,s.state.player.z));
    }
    expect(maxTravel).toBeGreaterThan(3);
    expect(a.approachingQuest).toBe(false);
    expect(a.enabled).toBe(true);
    expect(a.priority).toBe('quest');
    expect(a.radius).toBe(28);
  });
  it('cancels the movement on a second quest click and never auto claims rewards',()=>{
    const s=new LocalGameSession(newSave('Stop',0));
    const a=new AutoHuntController(s,()=>{});
    expect(a.startQuestHunt()).toBe(true);
    a.tick(.05);s.tick(.05);
    a.setEnabled(false);
    const start={x:s.state.player.x,z:s.state.player.z};
    for(let i=0;i<25;i++){a.tick(.05);s.tick(.05);}
    expect(a.enabled).toBe(false);
    expect(a.approachingQuest).toBe(false);
    expect(s.state.player.x).toBeCloseTo(start.x,4);
    expect(s.state.player.z).toBeCloseTo(start.z,4);
    expect(s.state.player.quest).toEqual({stage:0,progress:0});
  });
  it('does not falsely count unrelated, dungeon or mismatched species as a village quest kill',()=>{
    const slime={id:'local-0',name:'잉크 슬라임',npcId:20001};
    expect(questKillKind(slime)).toBe('slime');
    expect(matchesQuestTarget({...slime,id:'dungeon-0-0'},'slime')).toBe(false);
    expect(questKillKind({...slime,id:'dungeon-0-0'})).toBeNull();
    expect(questKillKind({id:'local-2',name:'알 수 없는 몬스터',npcId:20999})).toBeNull();
    expect(matchesQuestTarget({id:'local-2',name:'알 수 없는 몬스터',npcId:20003},'wanderer')).toBe(false);
    expect(questKillKind({id:'local-1',name:'숲의 방랑자',npcId:20003})).toBe('wanderer');
  });
  it('preserves original enemy IDs and elite while filling the field with extras',()=>{
    const s=new LocalGameSession(newSave('Population',0));
    expect(s.mobs.filter(m=>m.id.startsWith('local-'))).toHaveLength(18);
    expect(s.mobs.find(m=>m.id==='local-11')?.name).toBe('숲의 정예 감시자');
    expect(s.mobs.filter(m=>m.name==='잉크 슬라임')).toHaveLength(6);
    expect(s.mobs.every(m=>Number.isFinite(m.x)&&Number.isFinite(m.z))).toBe(true);
  });
  it('never auto walks inside a dungeon or after completing objectives',()=>{
    const s=new LocalGameSession(newSave('No exploit',0));
    const a=new AutoHuntController(s,()=>{});
    s.state.player.quest={stage:0,progress:3};
    expect(a.startQuestHunt()).toBe(false);
    expect(s.state.player.quest).toEqual({stage:0,progress:3});
    s.state.player.dungeon!.inside=true;
    expect(a.startQuestHunt()).toBe(false);
    expect(a.approachingQuest).toBe(false);
  });
});
