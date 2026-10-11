import {describe,it,expect} from 'vitest';
import {LocalGameSession,newSave,validateSave} from './session';
import {QUESTS,initialQuest,validateQuest,recordQuestKill,questSummary} from './adventure-quests';

const defeat=(s:LocalGameSession,idx:number)=>{
  const m=s.mobs[idx];m.x=s.state.player.x+1;m.z=s.state.player.z;m.hp=1;
  s.dispatch({type:'target',id:m.id});s.dispatch({type:'skill'});
  for(let i=0;i<81;i++)s.tick(.05);
};
describe('village quest board',()=>{
  it('accepts strict finite quest state and upgrades legacy saves without free rewards',()=>{
    const legacy=newSave('옛 여행자',0);delete legacy.player.quest;
    const original=JSON.stringify(legacy);
    expect(validateSave(legacy).player.quest).toEqual(initialQuest());
    expect(JSON.stringify(legacy)).toBe(original);
    expect(questSummary(validateQuest(undefined))).toContain('0 / 3');
    for(const invalid of [
      {stage:0,progress:4},{stage:3,progress:1},{stage:-1,progress:0},
      {stage:1,progress:NaN},{stage:1,progress:1.5},{stage:1,progress:0,admin:true},
    ])expect(()=>validateQuest(invalid)).toThrow('의뢰');
    expect(QUESTS).toHaveLength(3);
  });
  it('counts only target species, never duplicate or over-goal kills',()=>{
    const q=initialQuest();
    expect(recordQuestKill(q,'wanderer')).toBe(false);
    for(let i=0;i<6;i++)recordQuestKill(q,'slime');
    expect(q.progress).toBe(3);
    expect(recordQuestKill(q,'sentinel')).toBe(false);
  });
  it('plays three sequential stages, claimed once each at the town board',()=>{
    const s=new LocalGameSession(newSave('의뢰 사냥꾼',0));
    s.dispatch({type:'claim-quest'});
    expect(s.state.player.quest).toEqual({stage:0,progress:0});
    for(const i of [0,3,6])defeat(s,i);
    expect(s.state.player.quest).toEqual({stage:0,progress:3});
    s.state.player.x=75;s.state.player.z=75;
    const before=structuredClone(s.state.player);
    s.dispatch({type:'claim-quest'});
    expect(s.state.player.quest).toEqual(before.quest);
    expect(s.state.player.gold).toBe(before.gold);
    s.state.player.x=0;s.state.player.z=0;
    const payout=s.state.player.gold;
    s.dispatch({type:'claim-quest'});
    expect(s.state.player.quest).toEqual({stage:1,progress:0});
    expect(s.state.player.gold).toBe(payout+28);
    s.dispatch({type:'claim-quest'});
    expect(s.state.player.quest?.stage).toBe(1);
    for(const i of [1,2,4,5])defeat(s,i);
    expect(s.state.player.quest).toEqual({stage:1,progress:4});
    s.dispatch({type:'claim-quest'});
    expect(s.state.player.quest).toEqual({stage:2,progress:0});
    expect(s.mobs[11].name).toBe('숲의 정예 감시자');
    expect(s.mobs[11].maxHp).toBe(120);
    defeat(s,11);
    expect(s.state.player.quest).toEqual({stage:2,progress:1});
    s.dispatch({type:'claim-quest'});
    expect(s.state.player.quest).toEqual({stage:3,progress:0});
    const final=JSON.stringify(s.snapshot());
    s.dispatch({type:'claim-quest'});
    expect(JSON.stringify(s.snapshot())).toBe(final);
    const restored=new LocalGameSession(validateSave(JSON.parse(final)));
    expect(restored.state.player.quest).toEqual({stage:3,progress:0});
  });
  it('does not award overflowing gold, materials or potions',()=>{
    const s=new LocalGameSession(newSave('한도 확인',0));
    s.state.player.quest={stage:0,progress:3};
    s.state.player.gold=999999;
    const before=JSON.stringify(s.snapshot());
    s.dispatch({type:'claim-quest'});
    expect(JSON.stringify(s.snapshot())).toBe(before);
  });
});
