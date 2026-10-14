import { describe, expect, it, vi } from 'vitest';
import { createInventoryWindow } from './inventory-window';
import { newSave, LocalGameSession } from './session';

describe('inventory fitting preview entry', () => {
  it('keeps developer comparison windows out of the inventory', () => {
    const host = document.createElement('div');
    const player = newSave('비교 여행자', 0).player;
    const before = structuredClone(player);
    const action = vi.fn();
    const openShop = vi.fn();
    createInventoryWindow(host, () => player, action, openShop);
    expect(host.querySelector('a[href*="art-lab"],a[target="_blank"]')).toBeNull();
    expect(player).toEqual(before);
    expect(action).not.toHaveBeenCalled();
    expect(openShop).not.toHaveBeenCalled();
    expect(host.querySelectorAll('.bag-grid .item-slot')).toHaveLength(24);
  });
});

describe('owned armor in the original 24-slot inventory',()=>{
  it('crafts, stores, equips, unequips and restores armor through the actual UI',()=>{
    const session=new LocalGameSession(newSave('여행자',0));
    session.state.player.gold=150;session.state.player.wood=20;session.state.player.armor!.fragments=10;
    const host=document.createElement('div');
    const dispatch=vi.fn((intent:Parameters<typeof session.dispatch>[0])=>session.dispatch(intent));
    const window=createInventoryWindow(host,()=>session.state.player,dispatch,vi.fn());
    expect(host.querySelectorAll('.bag-grid .item-slot')).toHaveLength(24);
    expect(host.querySelector('[data-armor-bag]')).toBeNull();
    host.querySelector<HTMLButtonElement>('[data-craft-armor="body:1"]')!.click();
    expect(session.state.player.armor!.owned.body).toBe(1);
    expect(host.querySelectorAll('.bag-grid .item-slot')).toHaveLength(24);
    const armorSlot=host.querySelector<HTMLButtonElement>('[data-armor-bag="body:1"]');
    expect(armorSlot).not.toBeNull();
    armorSlot!.click();
    expect(session.state.player.armor!.equipped.body).toBe(0);
    expect(host.querySelector('.item-detail')!.textContent).toContain('경갑 갑옷');
    expect(host.querySelector('.equipment-comparison')!.textContent).toContain('방어력');
    host.querySelector<HTMLButtonElement>('#toggle-armor')!.click();
    expect(session.state.player.armor!.equipped.body).toBe(1);
    expect(host.querySelector<HTMLElement>('.armor-crafting')!.textContent).toContain('방어력 1');
    window.refresh();
    host.querySelector<HTMLButtonElement>('[data-unequip-armor="body"]')!.click();
    expect(session.state.player.armor!.equipped.body).toBe(0);
    expect(session.state.player.armor!.owned.body).toBe(1);
    expect(dispatch).toHaveBeenCalledWith({type:'craft-armor',slot:'body',tier:1});
  });
});


describe('mobile-visible crafting guidance',()=>{
  it('shows exact missing materials and prevents unavailable crafting without spending',()=>{
    const session=new LocalGameSession(newSave('재료',0));
    session.state.player.gold=0;session.state.player.wood=0;
    const host=document.createElement('div'), action=vi.fn();
    createInventoryWindow(host,()=>session.state.player,action,vi.fn());
    expect(host.querySelector('[data-recipe="1"]')!.textContent).toContain('부족 · 골드 24 · 목재 3 · 파편 2');
    const button=host.querySelector<HTMLButtonElement>('[data-craft-armor="body:1"]')!;
    expect(button.disabled).toBe(true);button.click();expect(action).not.toHaveBeenCalled();
  });
  it('refreshes availability after walking into the shop range with unchanged resources',()=>{
    const session=new LocalGameSession(newSave('상점',0));const p=session.state.player;
    p.gold=100;p.wood=20;p.armor!.fragments=10;p.x=60;p.z=30;
    const host=document.createElement('div'), action=vi.fn();
    const inventory=createInventoryWindow(host,()=>p,action,vi.fn());
    expect(host.querySelector('[data-recipe="1"]')!.textContent).toContain('마을 보급 상점 근처로 이동');
    expect(host.querySelector<HTMLButtonElement>('[data-craft-armor="body:1"]')!.disabled).toBe(true);
    p.x=0;p.z=0;inventory.refresh();
    expect(host.querySelector('[data-recipe="1"]')!.textContent).toContain('제작 가능');
    expect(host.querySelector<HTMLButtonElement>('[data-craft-armor="body:1"]')!.disabled).toBe(false);
    host.querySelector<HTMLButtonElement>('[data-craft-armor="body:1"]')!.click();
    expect(action).toHaveBeenCalledWith({type:'craft-armor',slot:'body',tier:1});
  });
});
