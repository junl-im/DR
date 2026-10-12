import type { Player } from './session';

/** The existing starter sword maps to the verified NJ MMO SquiresSword prop.
 * This is a visual-only id: no item is granted or persisted by this helper. */
export const STARTER_SWORD_VISUAL_ID = 2369;

export function equippedWeaponVisualId(player: Pick<Player, 'weaponEquipped'>): number {
  // Legacy save schema v1: undefined means equipped. Explicit false means bare hands.
  return player.weaponEquipped === false ? 0 : STARTER_SWORD_VISUAL_ID;
}
