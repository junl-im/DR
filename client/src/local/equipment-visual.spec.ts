import { describe, expect, it } from 'vitest';
import { equippedWeaponVisualId, STARTER_SWORD_VISUAL_ID } from './equipment-visual';

describe('local weapon visual selection', () => {
  it('uses the existing sword visual for equipped players', () => {
    expect(equippedWeaponVisualId({ weaponEquipped: true })).toBe(STARTER_SWORD_VISUAL_ID);
  });
  it('removes the sword visual when weapon is unequipped', () => {
    expect(equippedWeaponVisualId({ weaponEquipped: false })).toBe(0);
  });
  it('treats legacy save without weaponEquipped as equipped', () => {
    expect(equippedWeaponVisualId({})).toBe(STARTER_SWORD_VISUAL_ID);
  });
});
