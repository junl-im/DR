import { describe, expect, it, vi } from 'vitest';
import { createInventoryWindow } from './inventory-window';
import { newSave, LocalGameSession } from './session';

describe('inventory fitting preview entry', () => {
  it('links to a separate visual-only art lab without altering equipment ownership', () => {
    const host = document.createElement('div');
    const player = newSave('비교 여행자', 0).player;
    const before = structuredClone(player);
    const action = vi.fn();
    const openShop = vi.fn();
    createInventoryWindow(host, () => player, action, openShop);
    const link = host.querySelector<HTMLAnchorElement>('a.armor-preview-link');
    expect(link?.getAttribute('href')).toBe('./art-lab.html');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toContain('noopener');
    expect(host.textContent).toContain('시험용');
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
    expect(session.state.player.armor!.equipped.body).toBe(1);
    expect(host.querySelector<HTMLElement>('.armor-crafting')!.textContent).toContain('방어력 1');
    window.refresh();
    host.querySelector<HTMLButtonElement>('[data-unequip-armor="body"]')!.click();
    expect(session.state.player.armor!.equipped.body).toBe(0);
    expect(session.state.player.armor!.owned.body).toBe(1);
    expect(dispatch).toHaveBeenCalledWith({type:'craft-armor',slot:'body',tier:1});
  });
});
