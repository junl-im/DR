import { describe, expect, it, vi } from 'vitest';
import { createInventoryWindow } from './inventory-window';
import { newSave } from './session';

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
