import {describe,expect,it} from 'vitest';
import {AutoHuntController} from './auto-hunt';
import {LocalGameSession,newSave,validateSave} from './session';

function game():LocalGameSession {
  const save=newSave('장시간 사냥 검사',0);
  // Initialize movement and player from the same snapped point.
  save.player.x=34;save.player.z=-24;
  return new LocalGameSession(save);
}

function isolatedMob(s:LocalGameSession) {
  const p=s.state.player;
  const mob=s.mobs.find(m=>m.name==='잉크 슬라임'&&!m.id.startsWith('dungeon-'));
  if(!mob)throw new Error('field fixture is missing its normal monster');
  for(const other of s.mobs) {
    if(other===mob)continue;
    other.hp=0;
    other.respawn=Number.POSITIVE_INFINITY;
  }
  mob.hp=mob.maxHp;
  mob.x=p.x+1;
  mob.z=p.z;
  mob.homeX=mob.x;mob.homeZ=mob.z;
  return mob;
}

describe('long-running local auto hunt safety',()=>{
  it('clears a queued manual path when a new auto hunt patrol is enabled',()=>{
    const s=game();
    const p=s.state.player;
    const target=s.mobs.find(m=>Math.hypot(m.x-p.x,m.z-p.z)>4 && m.name!=='숲의 정예 감시자')!;
    s.dispatch({type:'move',x:target.x,z:target.z});
    const auto=new AutoHuntController(s,()=>{});
    expect(auto.setEnabled(true)).toBe(true);
    const start={x:p.x,z:p.z};
    // Before any new hunt decision there must be no leftover manual motion.
    for(let i=0;i<20;i++)s.tick(.05);
    expect(p.x).toBeCloseTo(start.x,6);
    expect(p.z).toBeCloseTo(start.z,6);
  });

  it('stops a dead target\'s pending chase, clears the highlight and waits for respawn',()=>{
    const s=game(),p=s.state.player, mob=isolatedMob(s);
    const targets:Array<string|null>=[];
    mob.x=p.x+9;mob.z=p.z;
    const auto=new AutoHuntController(s,id=>targets.push(id));
    auto.setEnabled(true);
    auto.tick(.05);
    expect(s.target).toBe(mob.id);
    // Simulate the remaining route already queued when another action kills it.
    s.dispatch({type:'move',x:mob.x,z:mob.z});
    mob.hp=0;mob.respawn=Number.POSITIVE_INFINITY;
    const start={x:p.x,z:p.z};
    auto.tick(.05);
    expect(s.target).toBeNull();
    expect(s.attacking).toBe(false);
    expect(targets.at(-1)).toBeNull();
    for(let i=0;i<25;i++){auto.tick(.05);s.tick(.05);}
    expect(p.x).toBeCloseTo(start.x,6);
    expect(p.z).toBeCloseTo(start.z,6);
    expect(auto.enabled).toBe(true);
  });

  it('reacquires the same monster after its finite respawn without free loot',()=>{
    const s=game(),mob=isolatedMob(s);
    const auto=new AutoHuntController(s,()=>{});
    expect(auto.setEnabled(true)).toBe(true);
    const before=s.state.player.kills;
    for(let i=0;i<120;i++){auto.tick(.05);s.tick(.05);}
    expect(s.state.player.kills).toBeGreaterThan(before);
    expect(mob.hp).toBe(0);
    const kills=s.state.player.kills, gold=s.state.player.gold;
    for(let i=0;i<140;i++){auto.tick(.05);s.tick(.05);}
    expect(s.state.player.kills).toBe(kills);
    expect(s.state.player.gold).toBe(gold);
    for(let i=0;i<350;i++){auto.tick(.05);s.tick(.05);}
    expect(s.state.player.kills).toBeGreaterThan(kills);
    expect(auto.progress.kills).toBe(s.state.player.kills-before);
    expect(auto.progress.gold).toBe(s.state.player.gold);
  });

  it('simulates two hours of real 50ms combat ticks with respawns and safe save data',()=>{
    const s=game();
    isolatedMob(s);
    const auto=new AutoHuntController(s,()=>{});
    auto.configure({radius:12,priority:'normal-only',potionThreshold:0});
    expect(auto.setEnabled(true)).toBe(true);
    const p=s.state.player;
    const start={x:p.x,z:p.z};
    // Virtual game time, not a claim of two hours of real browser/Android QA.
    for(let i=0;i<144000;i++){auto.tick(.05);s.tick(.05);}
    expect(auto.enabled).toBe(true);
    expect(auto.progress.seconds).toBeGreaterThanOrEqual(7199);
    expect(auto.progress.kills).toBeGreaterThan(200);
    expect(auto.progress.kills).toBe(p.kills);
    expect(auto.progress.gold).toBe(p.gold);
    expect(p.potions).toBeGreaterThanOrEqual(5);
    expect(p.hp).toBeGreaterThan(0);
    expect(p.x).toBeCloseTo(start.x,6);
    expect(p.z).toBeCloseTo(start.z,6);
    expect(validateSave(s.snapshot()).schemaVersion).toBe(1);
    expect(s.snapshot()).not.toHaveProperty('autoHunt');
    expect(s.snapshot()).not.toHaveProperty('unreachableUntil');
    auto.setEnabled(false);
    expect(s.attacking).toBe(false);
    auto.setEnabled(true);
    expect(auto.progress.kills).toBe(0);
    expect(auto.progress.seconds).toBe(0);
  },20000);
});
