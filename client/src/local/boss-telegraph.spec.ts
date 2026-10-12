import {describe,expect,it} from 'vitest';
import {newSave,LocalGameSession} from './session';
function makeBossFight(armor:boolean) {
  const save=newSave('방패병',0);save.player.x=30;save.player.z=-18;
  if(armor) {
    save.player.armor!.owned.helmet=2;save.player.armor!.owned.body=2;
    save.player.armor!.equipped.helmet=2;save.player.armor!.equipped.body=2;
  }
  const s=new LocalGameSession(save);
  const mob=s.mobs.find(m=>m.id==='local-11')!;
  mob.x=s.state.player.x+1;mob.z=s.state.player.z;
  for(const other of s.mobs)if(other!==mob){other.hp=0;other.respawn=100000;}
  return {s,mob};
}
describe('boss telegraph and mitigation',()=>{
  it('warns before damage, then recovers after a single aimed strike',()=>{
    const {s,mob}=makeBossFight(false);
    const hp=s.state.player.hp;
    s.tick(.05);
    expect(s.bossWarning).toContain('공격 예고');
    expect(mob.actionSeq).toBe(1);
    expect(s.state.player.hp).toBe(hp);
    for(let i=0;i<26;i++)s.tick(.05);
    expect(s.bossWarning).toBe('');
    expect(s.state.player.hp).toBe(hp-16);
    for(let i=0;i<20;i++)s.tick(.05);
    expect(s.state.player.hp).toBe(hp-16);
  });
  it('applies equipped defense to the windup strike, not arbitrary instant hits',()=>{
    const {s}=makeBossFight(true);
    for(let i=0;i<27;i++)s.tick(.05);
    expect(s.state.player.hp).toBe(88);
  });
  it('a nonmatching windup aim can be dodged without losing HP',()=>{
    const {s,mob}=makeBossFight(false);
    s.tick(.05);
    mob.aimX=s.state.player.x+5;
    const hp=s.state.player.hp;
    for(let i=0;i<27;i++)s.tick(.05);
    expect(s.state.player.hp).toBe(hp);
  });
  it('final guardian alternates aimed strike then a 5.5m sweep with an honest area preview',()=>{
    const save=newSave('구역 보스',0);save.player.quest={stage:3,progress:0};
    const s=new LocalGameSession(save);
    s.dispatch({type:'enter-dungeon'});
    s.state.player.dungeon={inside:true,wave:2,kills:0,clears:0};
    // Reconstruct the completed checkpoint via its real save loader.
    const restored=new LocalGameSession(s.snapshot());
    const mob=restored.mobs.find(m=>m.id==='dungeon-2-0')!;
    expect(mob).toBeDefined();
    for(const other of restored.mobs)if(other!==mob){other.hp=0;other.respawn=100000;}
    mob.x=restored.state.player.x+1;mob.z=restored.state.player.z;
    restored.tick(.05);
    expect(restored.bossThreat?.move).toBe('aimed-strike');
    expect(restored.bossThreat?.radius).toBe(2.3);
    for(let i=0;i<26;i++)restored.tick(.05);
    const afterHit=restored.state.player.hp;
    mob.cooldown=0;
    restored.tick(.05);
    expect(restored.bossThreat?.move).toBe('ground-sweep');
    expect(restored.bossThreat?.radius).toBe(5.5);
    expect(restored.bossWarning).toContain('원형 휩쓸기');
    // The sweep warning lasts longer than a strike, so moving off the area avoids it.
    mob.x=restored.state.player.x+9;mob.z=restored.state.player.z;
    for(let i=0;i<34;i++)restored.tick(.05);
    expect(restored.state.player.hp).toBe(afterHit);
    expect(restored.bossThreat).toBeNull();
  });

});
