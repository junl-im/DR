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
});
