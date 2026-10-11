/**
 * Dungeon zero local armor economy.
 *
 * Save schemaVersion stays 1. Legacy saves omit player.armor and are
 * interpreted as owning nothing; validation does NOT mint equipment.
 * Server-authoritative multiplayer trade/economy is a separate future phase.
 */
export const ARMOR_SLOTS = ['helmet', 'body', 'gloves', 'boots'] as const;
export type ArmorSlot = (typeof ARMOR_SLOTS)[number];
export type ArmorTier = 0 | 1 | 2;
export type CraftedArmorTier = 1 | 2;
export const ARMOR_LABELS: Record<ArmorSlot, string> = {
  helmet:'투구', body:'갑옷', gloves:'장갑', boots:'신발',
};
export const ARMOR_TIER_LABELS: Record<CraftedArmorTier, string> = {
  1:'경갑', 2:'중갑',
};
export interface ArmorInventory {
  fragments: number;
  /** bit 1 = medium, bit 2 = heavy; no starter armor is granted. */
  owned: Record<ArmorSlot, number>;
  /** tier 0 = unarmored/traveler appearance. */
  equipped: Record<ArmorSlot, ArmorTier>;
}
export const emptyArmor = (): ArmorInventory => ({
  fragments: 0,
  owned: {helmet:0,body:0,gloves:0,boots:0},
  equipped: {helmet:0,body:0,gloves:0,boots:0},
});
export function readArmor(armor?: ArmorInventory): ArmorInventory {
  return armor ?? emptyArmor();
}
export function isArmorSlot(value: unknown): value is ArmorSlot {
  return typeof value === 'string' && ARMOR_SLOTS.includes(value as ArmorSlot);
}
export function isCraftedArmorTier(value: unknown): value is CraftedArmorTier {
  return value === 1 || value === 2;
}
export function armorBit(tier: CraftedArmorTier): number {
  return tier === 1 ? 1 : 2;
}
export function ownsArmor(armor: ArmorInventory, slot: ArmorSlot, tier: CraftedArmorTier): boolean {
  return (armor.owned[slot] & armorBit(tier)) !== 0;
}
export const armorCraftCost = (tier: CraftedArmorTier) =>
  tier === 1 ? {gold:24,wood:3,fragments:2} : {gold:90,wood:10,fragments:8};
export function armorDefense(armor?: ArmorInventory): number {
  const slots = readArmor(armor).equipped;
  return ARMOR_SLOTS.reduce((total, slot) => total + slots[slot], 0);
}
export function validateArmor(value: unknown): ArmorInventory {
  if (value === undefined) return emptyArmor();
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('방어구 저장 정보가 올바르지 않습니다.');
  const armor = value as ArmorInventory;
  if (!Number.isInteger(armor.fragments) || armor.fragments < 0 || armor.fragments > 1000000) {
    throw new Error('방어구 재료 수량이 올바르지 않습니다.');
  }
  if (!armor.owned || typeof armor.owned !== 'object' || Array.isArray(armor.owned) ||
      !armor.equipped || typeof armor.equipped !== 'object' || Array.isArray(armor.equipped)) {
    throw new Error('방어구 보관 정보가 올바르지 않습니다.');
  }
  for (const slot of ARMOR_SLOTS) {
    const owned = armor.owned[slot], equipped = armor.equipped[slot];
    if (!Number.isInteger(owned) || owned < 0 || owned > 3 ||
        !Number.isInteger(equipped) || equipped < 0 || equipped > 2 ||
        (equipped > 0 && (owned & armorBit(equipped as CraftedArmorTier)) === 0)) {
      throw new Error('방어구 보유/장착 정보가 일치하지 않습니다.');
    }
  }
  if (Object.keys(armor.owned).some(slot=>!isArmorSlot(slot)) ||
      Object.keys(armor.equipped).some(slot=>!isArmorSlot(slot)) ||
      Object.keys(armor).some(key=>!['fragments','owned','equipped'].includes(key))) {
    throw new Error('알 수 없는 방어구 저장 정보가 있습니다.');
  }
  return structuredClone(armor);
}
