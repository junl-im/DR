import { describe, expect, it } from 'vitest';
import {ARMOR_SLOTS, armorDefense, armorCraftCost, emptyArmor, validateArmor} from './armor-economy';
import {LocalGameSession,newSave,validateSave} from './session';

describe('real armor progression with schema v1 compatibility',()=>{
  it('migrates old saves to empty armor without mutating prior bytes or minting items',()=>{
    const save=newSave('기존 여행자',0);delete save.player.armor;
    const before=JSON.stringify(save);
    const current=validateSave(save);
    expect(JSON.stringify(save)).toBe(before);
    expect(current.schemaVersion).toBe(1);
    expect(current.player.armor).toEqual(emptyArmor());
    expect(armorDefense(current.player.armor)).toBe(0);
    expect(ARMOR_SLOTS).toHaveLength(4);
  });
  it('rejects a crafted item lacking ownership, illegal tiers and malformed fields',()=>{
    const good=newSave('보관소',0);
    const broken=structuredClone(good);
    broken.player.armor!.equipped.helmet=2;
    expect(()=>validateSave(broken)).toThrow('방어구');
    broken.player.armor!.owned.helmet=2;
    expect(validateSave(broken).player.armor!.equipped.helmet).toBe(2);
    broken.player.armor!.fragments=NaN;
    expect(()=>validateSave(broken)).toThrow();
    const other=structuredClone(good);
    (other.player.armor!.owned as Record<string,number>).shield=1;
    expect(()=>validateSave(other)).toThrow();
  });
  it('requires town proximity, exact currency and loot fragments before crafting',()=>{
    const s=new LocalGameSession(newSave('제작사',0));
    s.dispatch({type:'craft-armor',slot:'body',tier:1});
    expect(s.state.player.armor!.owned.body).toBe(0);
    const price=armorCraftCost(1);
    s.state.player.gold=price.gold;s.state.player.wood=price.wood;s.state.player.armor!.fragments=price.fragments;
    s.state.player.x=80;s.state.player.z=80;
    s.dispatch({type:'craft-armor',slot:'body',tier:1});
    expect(s.state.player.armor!.owned.body).toBe(0);
    s.state.player.x=0;s.state.player.z=0;
    s.dispatch({type:'craft-armor',slot:'body',tier:1});
    expect(s.state.player.armor!.owned.body).toBe(1);
    expect(s.state.player.gold).toBe(0);
    expect(s.state.player.wood).toBe(0);
    expect(s.state.player.armor!.fragments).toBe(0);
    s.dispatch({type:'craft-armor',slot:'body',tier:1});
    expect(s.state.player.armor!.owned.body).toBe(1);
  });
  it('equip and unequip are ownership-gated, slot-independent and persist',()=>{
    const s=new LocalGameSession(newSave('장비가',0));
    s.dispatch({type:'equip-armor',slot:'helmet',tier:2});
    expect(s.state.player.armor!.equipped.helmet).toBe(0);
    s.state.player.armor!.owned.helmet=3;
    s.state.player.armor!.owned.body=1;
    s.dispatch({type:'equip-armor',slot:'helmet',tier:2});
    s.dispatch({type:'equip-armor',slot:'body',tier:1});
    expect(armorDefense(s.state.player.armor)).toBe(3);
    s.dispatch({type:'unequip-armor',slot:'helmet'});
    expect(armorDefense(s.state.player.armor)).toBe(1);
    expect(s.state.player.armor!.owned.helmet).toBe(3);
    const saved=JSON.parse(JSON.stringify(s.snapshot()));
    const resumed=new LocalGameSession(validateSave(saved));
    expect(resumed.state.player.armor).toEqual(s.state.player.armor);
  });
  it('awards shards after real kills without changing original gold RNG or item duplication',()=>{
    const s=new LocalGameSession(newSave('사냥꾼',0));
    for(let i=0;i<2;i++){
      const m=s.mobs[i];m.x=s.state.player.x+1;m.z=s.state.player.z;m.hp=1;
      s.dispatch({type:'target',id:m.id});s.dispatch({type:'skill'});
      for(let j=0;j<81;j++)s.tick(.05);
    }
    expect(s.state.player.kills).toBe(2);
    expect(s.state.player.armor!.fragments).toBe(1);
  });
  it('applies armor defense only after an owned piece is equipped',()=>{
    const original=new LocalGameSession(newSave('방어 확인',0));
    const protectedPlayer=new LocalGameSession(newSave('방어 확인',0));
    protectedPlayer.state.player.armor!.owned.helmet=2;
    protectedPlayer.state.player.armor!.owned.body=2;
    protectedPlayer.dispatch({type:'equip-armor',slot:'helmet',tier:2});
    protectedPlayer.dispatch({type:'equip-armor',slot:'body',tier:2});
    for(const s of [original,protectedPlayer]){
      s.state.player.x=30;s.state.player.z=-19;
      s.mobs[0].x=30;s.mobs[0].z=-19;
      s.tick(.05);
    }
    expect(original.state.player.hp-protectedPlayer.state.player.hp).toBeLessThan(0);
    expect(original.state.player.hp).toBe(93);
    expect(protectedPlayer.state.player.hp).toBe(97);
  });
});
