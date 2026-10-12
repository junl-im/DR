import { describe, it, expect, vi } from 'vitest';
import { LocalGameSession, newSave, validateSave, maxHp } from './session';
describe('Dungeon zero local progression contract', () => {
  it('limits repeated failed A* combat chase retries without changing player speed or saves',()=>{
    const save=newSave('추격 테스트',0);
    save.player.x=34;save.player.z=-24;
    const s=new LocalGameSession(save);
    const mob=s.mobs.find(m=>m.hp>0)!;
    mob.x=s.state.player.x+9;mob.z=s.state.player.z;
    s.dispatch({type:'target',id:mob.id});
    s.dispatch({type:'attack'});
    const move=vi.spyOn(s as unknown as {move:(x:number,z:number)=>void},'move')
      .mockImplementation(()=>{}); // simulate a completely blocked goal
    for(let i=0;i<10;i++)s.tick(.05);
    expect(move).toHaveBeenCalledTimes(1);
    for(let i=0;i<5;i++)s.tick(.05);
    expect(move).toHaveBeenCalledTimes(2);
    expect(s.attacking).toBe(true);
    expect(s.snapshot()).not.toHaveProperty('chaseRetryAt');
  });

  it('replays the same intents deterministically and rejects unbounded time', () => {
    const a = new LocalGameSession(newSave('여행자', 0)), b = new LocalGameSession(newSave('여행자', 0));
    a.dispatch({type:'move',x:8,z:4}); b.dispatch({type:'move',x:8,z:4});
    for(let i=0;i<100;i++) { a.tick(.05); b.tick(.05); }
    expect(a.snapshot()).toEqual(b.snapshot()); expect(a.state.player.x).not.toBe(0);
    const before = a.snapshot(); a.tick(Infinity); expect(a.snapshot()).toEqual(before);
  });
  it('kills grant loot once, advance level, and survive a save round trip', () => {
    const s = new LocalGameSession(newSave('여행자', 10));
    for (const m of s.mobs.slice(0,2)) {
      m.x = s.state.player.x + 2; m.z = s.state.player.z; m.hp = 1;
      s.dispatch({type:'target',id:m.id}); s.dispatch({type:'skill'});
      for(let i=0;i<81;i++) s.tick(.05);
    }
    expect(s.state.player.level).toBe(2); expect(s.state.player.kills).toBe(2); expect(s.state.player.gold).toBeGreaterThanOrEqual(16);
    const copy = new LocalGameSession(validateSave(JSON.parse(JSON.stringify(s.snapshot()))));
    expect(copy.state.player).toEqual(s.state.player);
  });
  it('prevents reward without a target, out of range, or without resources', () => {
    const s = new LocalGameSession(newSave('여행자', 0));
    s.dispatch({type:'skill'}); s.dispatch({type:'upgrade'}); s.dispatch({type:'garden'});
    expect(s.state.player.gold).toBe(0); expect(s.state.player.weapon).toBe(0); expect(s.state.territory.garden).toBe(0);
    s.dispatch({type:'target',id:s.mobs[0].id}); s.dispatch({type:'skill'}); expect(s.state.player.mp).toBe(60);
  });
  it('builds a resource-funded garden and collects only earned production', () => {
    const s = new LocalGameSession(newSave('여행자', 0));
    s.state.player.wood = 12; s.dispatch({type:'garden'}); expect(s.state.player.wood).toBe(0);
    for(let i=0;i<160;i++) s.tick(.05);
    s.dispatch({type:'collect'}); expect(s.state.player.gold).toBe(1);
    s.dispatch({type:'collect'}); expect(s.state.player.gold).toBe(1);
  });
  it('respawns defeated players at home and caps death loss', () => {
    const s = new LocalGameSession(newSave('여행자', 0)); const m = s.mobs[0];
    s.state.player.x = m.x; s.state.player.z = m.z; s.state.player.hp = 1; s.state.player.gold = 2;
    s.dispatch({type:'move',x:m.x,z:m.z});
    // Set movement via the actual saved position, as a restored field character.
    const field = new LocalGameSession(s.snapshot()); field.mobs[0].x = field.state.player.x; field.mobs[0].z = field.state.player.z;
    field.tick(.05); expect(field.state.player.hp).toBe(maxHp(field.state.player)); expect(field.state.player.gold).toBe(0); expect(field.state.player.x).toBe(0);
  });
  it('rejects corrupt, future-schema, and invalid character saves', () => {
    const good = newSave('여행자',0);
    expect(()=>validateSave({...good,schemaVersion:2})).toThrow();
    expect(()=>validateSave({...good,player:{...good.player,gold:-1}})).toThrow();
    expect(()=>validateSave({...good,player:{...good.player,classId:999}})).toThrow();
    expect(()=>validateSave({...good,player:{...good.player,x:NaN}})).toThrow();
  });
  it('emits actual damage and both loot and level events without persisting presentation events',()=>{
    const s=new LocalGameSession(newSave('모험가',0));s.state.player.xp=30;
    const m=s.mobs[0];m.x=s.state.player.x+2;m.z=s.state.player.z;m.hp=1;
    s.dispatch({type:'target',id:m.id});s.dispatch({type:'skill'});
    const events=s.drainEvents();expect(events.map(e=>e.kind)).toEqual(['damage','loot','level']);expect(events[0].amount).toBe(1);expect(events[2].amount).toBe(2);
    expect(s.drainEvents()).toEqual([]);expect(new LocalGameSession(s.snapshot()).drainEvents()).toEqual([]);
  });
  it('enforces skill cooldown before spending more MP or applying another hit',()=>{
    const s=new LocalGameSession(newSave('모험가',0)),m=s.mobs[0];m.x=s.state.player.x+2;m.z=s.state.player.z;
    s.dispatch({type:'target',id:m.id});s.dispatch({type:'skill'});s.drainEvents();const hp=m.hp,mp=s.state.player.mp;
    s.dispatch({type:'skill'});expect(m.hp).toBe(hp);expect(s.state.player.mp).toBe(mp);expect(s.drainEvents()).toEqual([]);expect(s.skillCooldown).toBe(4);
    for(let i=0;i<81;i++)s.tick(.05);expect(s.skillCooldown).toBe(0);s.dispatch({type:'skill'});expect(m.hp).toBe(0);
  });
});

describe('town supply transactions',()=>{
  it('spends exactly the price and persists purchased supplies',()=>{
    const s=new LocalGameSession(newSave('상인',0));s.state.player.gold=40;
    s.dispatch({type:'buy-potion',quantity:5});
    expect(s.state.player.gold).toBe(0);expect(s.state.player.potions).toBe(10);
    expect(new LocalGameSession(s.snapshot()).state.player).toEqual(s.state.player);
    s.dispatch({type:'buy-potion',quantity:1});expect(s.state.player.potions).toBe(10);
  });
  it('rejects invalid quantities, remote purchases and capacity overflow atomically',()=>{
    const s=new LocalGameSession(newSave('상인',0));s.state.player.gold=100;
    for(const quantity of [0,-1,1.5,11,NaN,Infinity])s.dispatch({type:'buy-potion',quantity});
    expect(s.state.player.gold).toBe(100);expect(s.state.player.potions).toBe(5);
    s.state.player.x=80;s.dispatch({type:'buy-potion',quantity:1});expect(s.state.player.gold).toBe(100);
    s.dispatch({type:'recall'});s.state.player.potions=999999;
    s.dispatch({type:'buy-potion',quantity:5});expect(s.state.player.gold).toBe(100);expect(s.state.player.potions).toBe(999999);
  });
});

describe('equipment progression and compatibility',()=>{
  it('migrates old saves without mutation and preserves explicitly unequipped saves',()=>{
    const legacy=newSave('모험가',0);delete legacy.player.weaponEquipped;
    expect(validateSave(legacy).player.weaponEquipped).toBe(true);expect(legacy.player.weaponEquipped).toBeUndefined();
    legacy.player.weaponEquipped=false;expect(validateSave(legacy).player.weaponEquipped).toBe(false);
    expect(()=>validateSave({...legacy,player:{...legacy.player,weaponEquipped:'false'}})).toThrow();
  });
  it('unequips without losing enhancement, changes actual damage and gates skills without spending MP',()=>{
    const s=new LocalGameSession(newSave('모험가',0));s.state.player.weapon=2;
    const m=s.mobs[0];m.x=s.state.player.x+1;m.z=s.state.player.z;m.hp=1000;m.maxHp=1000;
    s.dispatch({type:'target',id:m.id});s.dispatch({type:'attack'});s.tick(.05);expect(m.hp).toBe(980);
    s.dispatch({type:'unequip-weapon'});expect(s.attacking).toBe(false);expect(s.state.player.weapon).toBe(2);
    const mp=s.state.player.mp;s.dispatch({type:'skill'});expect(s.state.player.mp).toBe(mp);expect(s.skillCooldown).toBe(0);expect(m.hp).toBe(980);
    for(let i=0;i<17;i++)s.tick(.05);s.dispatch({type:'attack'});s.tick(.05);expect(m.hp).toBe(974);
    const restored=new LocalGameSession(s.snapshot());expect(restored.state.player.weaponEquipped).toBe(false);expect(restored.state.player.weapon).toBe(2);
    s.dispatch({type:'equip-weapon'});s.dispatch({type:'equip-weapon'});expect(s.state.player.weaponEquipped).toBe(true);expect(s.state.player.weapon).toBe(2);
  });
});
