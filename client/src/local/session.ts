import { createPathMoveState, stepAlongPath, findPath, snapToNearestWalkable, snapEntityY, EntityAction, type PathMoveState } from '@nj/game-core';
import {ARMOR_LABELS, ARMOR_TIER_LABELS, armorBit, armorCraftCost, armorDefense, emptyArmor, isArmorSlot, isCraftedArmorTier, ownsArmor, validateArmor, type ArmorSlot, type CraftedArmorTier, type ArmorInventory} from './armor-economy';
import { initialQuest, validateQuest, recordQuestKill, activeQuest, canClaimQuest, nearQuestBoard, questSummary, type QuestProgress, type HuntKind } from './adventure-quests';

export const GAME_VERSION = '0.6.0';
export const POTION_PRICE = 8;
export const POTION_SHOP = { x: 5, z: 5, radius: 12 };
export const canUsePotionShop = (p: Player) => Math.hypot(p.x-POTION_SHOP.x,p.z-POTION_SHOP.z)<=POTION_SHOP.radius;
export interface GameEvent {kind:'damage'|'hurt'|'loot'|'level'|'heal';x:number;z:number;amount:number;text:string}
export interface Player { name: string; classId: number; x: number; z: number; hp: number; mp: number; level: number; xp: number; gold: number; wood: number; potions: number; weapon: number; weaponEquipped?: boolean; armor?: ArmorInventory; quest?: QuestProgress; kills: number }
export interface Save { schemaVersion: 1; gameVersion: string; updatedAt: number; seed: number; player: Player; territory: { hall: number; garden: number; stored: number } }
export interface Mob { id: string; npcId: number; name: string; x: number; z: number; homeX: number; homeZ: number; hp: number; maxHp: number; respawn: number; action: number; actionSeq: number; cooldown: number }
export type Intent = {type:'claim-quest'} | { type: 'craft-armor' | 'equip-armor'; slot: ArmorSlot; tier: CraftedArmorTier } | { type:'unequip-armor'; slot: ArmorSlot } | { type: 'buy-potion'; quantity: number } | { type: 'move'; x: number; z: number } | { type: 'target'; id: string } | { type: 'equip-weapon' | 'unequip-weapon' | 'attack' | 'skill' | 'potion' | 'recall' | 'upgrade' | 'gather' | 'garden' | 'collect' };
export interface GameSession { readonly mode: 'local' | 'online'; dispatch(intent: Intent): void; tick(dt: number): void; snapshot(): Save }
export const isWeaponEquipped = (p: Player) => p.weaponEquipped !== false;
export const attackPower = (p: Player) => 4 + p.level * 2 + (isWeaponEquipped(p) ? 6 + p.weapon * 4 : 0);
export const maxHp = (p: Player) => 100 + (p.level - 1) * 18;
export const xpNeeded = (p: Player) => 60 + (p.level - 1) * 30;
export function newSave(name: string, classId: number): Save {
  return { schemaVersion: 1, gameVersion: GAME_VERSION, updatedAt: 0, seed: 20261011,
    player: { name: name.trim().slice(0, 20) || '모험가', classId, x: 0, z: 0, hp: 100, mp: 60, level: 1, xp: 0, gold: 0, wood: 0, potions: 5, weapon: 0, weaponEquipped: true, armor: emptyArmor(), quest: initialQuest(), kills: 0 },
    territory: { hall: 1, garden: 0, stored: 0 } };
}
export function validateSave(raw: unknown): Save {
  if (!raw || typeof raw !== 'object') throw new Error('저장 데이터 형식이 올바르지 않습니다.');
  const s = raw as Save;
  if (s.schemaVersion !== 1) throw new Error('지원하지 않는 저장 버전입니다. 파일을 보존하고 업데이트를 확인해주세요.');
  if (typeof s.gameVersion !== 'string' || !Number.isFinite(s.updatedAt) || !Number.isInteger(s.seed)) throw new Error('저장 정보가 손상되었습니다.');
  const p = s.player;
  if (!p || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 20 || ![0, 10, 18].includes(p.classId)) throw new Error('캐릭터 정보가 올바르지 않습니다.');
  if (!Number.isFinite(p.x) || !Number.isFinite(p.z) || Math.abs(p.x) > 315 || Math.abs(p.z) > 315) throw new Error('캐릭터 위치가 올바르지 않습니다.');
  for (const key of ['hp', 'mp', 'level', 'xp', 'gold', 'wood', 'potions', 'weapon', 'kills'] as const) {
    if (!Number.isInteger(p[key]) || p[key] < 0 || p[key] > 1000000) throw new Error('캐릭터 수치가 올바르지 않습니다.');
  }
  if (p.level < 1 || p.level > 100 || p.hp > maxHp(p) || p.mp > 60 || p.weapon > 20 || p.xp >= xpNeeded(p)) throw new Error('캐릭터 성장 정보가 올바르지 않습니다.');
  if (!s.territory || !Number.isInteger(s.territory.hall) || s.territory.hall !== 1 || !Number.isInteger(s.territory.garden) || s.territory.garden < 0 || s.territory.garden > 5 || !Number.isFinite(s.territory.stored) || s.territory.stored < 0 || s.territory.stored > 120) throw new Error('영지 정보가 올바르지 않습니다.');
  if (p.weaponEquipped !== undefined && typeof p.weaponEquipped !== 'boolean') throw new Error('무기 장착 정보가 올바르지 않습니다.');
  const copy=structuredClone(s);copy.player.weaponEquipped ??= true;copy.player.armor=validateArmor(p.armor);copy.player.quest=validateQuest(p.quest);return copy;
}

export class LocalGameSession implements GameSession {
  readonly mode = 'local';
  state: Save;
  mobs: Mob[] = [];
  target: string | null = null;
  attacking = false;
  action = EntityAction.None;
  actionSeq = 0;
  message = '시작의 마을에 도착했습니다. 몬스터를 선택하고 사냥을 시작하세요.';
  private events: GameEvent[] = [];
  drainEvents(): GameEvent[] { return this.events.splice(0); }
  private emit(event: GameEvent): void { this.events.push(event); if(this.events.length>128)this.events.shift(); }
  get skillCooldown(): number { return Math.max(0,this.skillAt-this.clock); }
  private movement: PathMoveState;
  private clock = 0;
  private attackAt = 0;
  private skillAt = 0;
  private actionUntil = 0;
  private regen = 0;
  constructor(save: Save) {
    this.state = validateSave(save);
    const start = snapToNearestWalkable(save.player.x, save.player.z) ?? { x: 0, z: 0 };
    this.state.player.x = start.x; this.state.player.z = start.z;
    this.movement = createPathMoveState(start.x, snapEntityY(start.x, start.z), start.z);
    for (let i = 0; i < 12; i++) {
      const spot = snapToNearestWalkable(26 + (i % 4) * 11, -18 - Math.floor(i / 4) * 15);
      if (!spot) continue;
      const elite=i===11;
      const hp=elite?120:45;
      this.mobs.push({ id:`local-${i}`, npcId:i%3===0?20001:20003,
        name:elite?'숲의 정예 감시자':i%3===0?'잉크 슬라임':'숲의 방랑자',
        ...spot,homeX:spot.x,homeZ:spot.z,hp,maxHp:hp,respawn:0,action:0,actionSeq:0,cooldown:0 });
    }
  }
  private random(): number { this.state.seed = (Math.imul(1664525, this.state.seed) + 1013904223) >>> 0; return this.state.seed / 4294967296; }
  snapshot(): Save { return structuredClone({ ...this.state, gameVersion: GAME_VERSION }); }
  private move(x: number, z: number): void {
    if (!Number.isFinite(x) || !Number.isFinite(z) || Math.abs(x) > 315 || Math.abs(z) > 315) return;
    const to = snapToNearestWalkable(x, z); if (!to) { this.message = '그곳으로 이동할 수 없습니다.'; return; }
    const path = findPath(this.state.player, to);
    if (!path.length && Math.hypot(to.x - this.state.player.x, to.z - this.state.player.z) > 2) { this.message = '이동 경로를 찾을 수 없습니다.'; return; }
    this.movement = { ...this.movement, targetX: to.x, targetZ: to.z, waypoints: path, waypointIndex: 0 };
  }
  dispatch(intent: Intent): void {
    const p = this.state.player;
    if (intent.type === 'equip-weapon' || intent.type === 'unequip-weapon') {
      const equipped=intent.type==='equip-weapon';
      if(isWeaponEquipped(p)===equipped){this.message=equipped?'이미 무기를 장착했습니다.':'이미 무기를 해제했습니다.';return;}
      p.weaponEquipped=equipped;this.attacking=false;
      this.message=equipped?`여행자의 무기 장착 · 공격력 ${attackPower(p)}`:`무기 해제 · 공격력 ${attackPower(p)}`;return;
    }
    if (intent.type === 'craft-armor' || intent.type === 'equip-armor' || intent.type === 'unequip-armor') {
      if (!isArmorSlot(intent.slot) ||
          (intent.type !== 'unequip-armor' && !isCraftedArmorTier(intent.tier))) {
        this.message = '알 수 없는 방어구 항목입니다.'; return;
      }
      const armor = p.armor!; // constructor validates and initializes old save data.
      const slot = intent.slot;
      if (intent.type === 'unequip-armor') {
        if (!armor.equipped[slot]) {this.message='해제할 방어구가 없습니다.';return;}
        armor.equipped[slot] = 0;
        this.message = ARMOR_LABELS[slot] + ' 해제 · 방어력 ' + armorDefense(armor);
        return;
      }
      const tier = intent.tier;
      if (intent.type === 'equip-armor') {
        if (!ownsArmor(armor,slot,tier)) {this.message='보유하지 않은 방어구입니다.';return;}
        if (armor.equipped[slot]===tier) {this.message='이미 착용한 방어구입니다.';return;}
        armor.equipped[slot] = tier;
        this.message = ARMOR_TIER_LABELS[tier] + ' ' + ARMOR_LABELS[slot] + ' 착용 · 방어력 ' + armorDefense(armor);
        return;
      }
      if (!canUsePotionShop(p)) {this.message='제작은 마을 보급 상점 근처에서 할 수 있습니다.';return;}
      if (ownsArmor(armor,slot,tier)) {this.message='이미 보유한 방어구입니다.';return;}
      const cost=armorCraftCost(tier);
      if(p.gold<cost.gold || p.wood<cost.wood || armor.fragments<cost.fragments) {
        this.message='재료 부족 · 골드 '+cost.gold+' · 목재 '+cost.wood+' · 파편 '+cost.fragments;return;
      }
      p.gold-=cost.gold; p.wood-=cost.wood; armor.fragments-=cost.fragments;
      armor.owned[slot] |= armorBit(tier);
      this.message = ARMOR_TIER_LABELS[tier] + ' ' + ARMOR_LABELS[slot] + ' 제작 완료';
      return;
    }
    if (intent.type === 'claim-quest') {
      const q=p.quest!;
      const quest=activeQuest(q);
      if(!quest){this.message='완료한 의뢰를 모두 정리했습니다.';return;}
      if(!nearQuestBoard(p.x,p.z)){this.message='마을 모험 안내판에서 의뢰 보상을 수령하세요.';return;}
      if(!canClaimQuest(q)){this.message='아직 의뢰 목표를 달성하지 못했습니다.';return;}
      const {gold,wood,potions,fragments}=quest.reward;
      if(p.gold+gold>1000000||p.wood+wood>1000000||
         p.potions+potions>1000000||p.armor!.fragments+fragments>1000000) {
        this.message='보관 한도를 초과해 보상을 수령할 수 없습니다.';return;
      }
      p.gold+=gold;p.wood+=wood;p.potions+=potions;p.armor!.fragments+=fragments;
      q.stage++;q.progress=0;
      this.message=quest.title+' 완료 · 골드 +'+gold+' · 목재 +'+wood+' · 물약 +'+potions+' · 파편 +'+fragments;
      this.emit({kind:'loot',x:p.x,z:p.z,amount:gold,text:this.message});
      return;
    }
    if (intent.type === 'buy-potion') {
      const quantity=intent.quantity;
      if (!Number.isInteger(quantity) || quantity<1 || quantity>10) { this.message='구매 수량은 1~10개입니다.'; return; }
      if (!canUsePotionShop(p)) { this.message='마을 보급 상점 가까이 이동해주세요.'; return; }
      const cost=POTION_PRICE*quantity;
      if (p.gold<cost) { this.message=`골드 ${cost}개가 필요합니다.`; return; }
      if (p.potions+quantity>1000000) { this.message='물약을 더 보관할 수 없습니다.'; return; }
      p.gold-=cost; p.potions+=quantity;
      this.message=`회복 물약 ${quantity}개 구매 · 골드 -${cost}`;
      return;
    }
    if (intent.type === 'move') { this.attacking = false; this.move(intent.x, intent.z); }
    if (intent.type === 'target') { this.target = this.mobs.some(m => m.id === intent.id && m.hp > 0) ? intent.id : null; this.attacking = false; }
    if (intent.type === 'attack') { this.attacking = !this.attacking; if (!this.target) { this.attacking = false; this.message = '먼저 몬스터를 선택하세요.'; } }
    if (intent.type === 'skill') {
      const m = this.mobs.find(m => m.id === this.target && m.hp > 0);
      if (!isWeaponEquipped(p)) this.message = '강타를 사용하려면 무기를 장착하세요.';
      else if (!m) this.message = '먼저 몬스터를 선택하세요.';
      else if (Math.hypot(m.x - p.x, m.z - p.z) > 12) this.message = '스킬 사거리가 닿지 않습니다.';
      else if (this.clock < this.skillAt) this.message = '강타를 준비하고 있습니다.';
      else if (p.mp < 12) this.message = '마나가 부족합니다.';
      else { p.mp -= 12; this.skillAt = this.clock + 4; this.action = EntityAction.Cast; this.actionSeq++; this.actionUntil = this.clock + .7; this.damage(m, 27 + p.weapon * 4 + p.level * 3); }
    }
    if (intent.type === 'potion') { if (p.potions && p.hp < maxHp(p)) { const healed=Math.min(55,maxHp(p)-p.hp);p.potions--; p.hp += healed;this.emit({kind:'heal',x:p.x,z:p.z,amount:healed,text:`회복 +${healed}`}); this.message = '회복 물약을 사용했습니다.'; } else this.message = '물약이 없거나 체력이 가득 찼습니다.'; }
    if (intent.type === 'recall') { p.x = 0; p.z = 0; p.hp = maxHp(p); p.mp = 60; this.movement = createPathMoveState(); this.attacking = false; this.target = null; this.message = '안전한 마을로 귀환했습니다.'; }
    if (intent.type === 'upgrade') { const cost = 20 * (p.weapon + 1); if (p.weapon >= 20) this.message = '최고 강화 단계입니다.'; else if (p.gold < cost) this.message = `강화에는 골드 ${cost}개가 필요합니다.`; else { p.gold -= cost; p.weapon++; this.message = `여행자의 무기를 +${p.weapon}로 강화했습니다.`; } }
    if (intent.type === 'gather') { if (Math.hypot(p.x, p.z) > 24) this.message = '채집은 마을 주변에서 할 수 있습니다.'; else if (this.clock < this.attackAt) this.message = '잠시 후 다시 채집하세요.'; else { p.wood += 3; this.attackAt = this.clock + 2; this.message = '마을 주변에서 목재 3개를 모았습니다.'; } }
    if (intent.type === 'garden') { const t = this.state.territory, cost = 12 + t.garden * 6; if (t.garden >= 5) this.message = '정원은 최고 단계입니다.'; else if (p.wood < cost) this.message = `정원 확장에는 목재 ${cost}개가 필요합니다.`; else { p.wood -= cost; t.garden++; this.message = '영지 정원을 확장했습니다. 플레이 중 골드를 생산합니다.'; } }
    if (intent.type === 'collect') { const t = this.state.territory, amount = Math.floor(t.stored + 1e-9); p.gold += amount; t.stored = Math.max(0, t.stored - amount); this.message = amount ? `정원에서 골드 ${amount}개를 수확했습니다.` : '정원이 생산 중입니다.'; }
  }
  private damage(m: Mob, amount: number): void {
    const dealt=Math.min(m.hp,amount);m.hp -= dealt; this.message = `${m.name}에게 ${dealt} 피해`;this.emit({kind:'damage',x:m.x,z:m.z,amount:dealt,text:this.message});
    if (m.hp !== 0) return;
    m.action = EntityAction.Die; m.actionSeq++; m.respawn = this.clock + (m.name==='숲의 정예 감시자'?35:15);
    const p = this.state.player, elite=m.name==='숲의 정예 감시자';
    const gold = (8 + Math.floor(this.random() * 7)) + (elite?18:0);
    p.gold += gold; p.xp += elite?75:30; p.kills++; p.wood += elite?3:1;
    // Deterministic local progression: every 2nd actual kill earns one shard.
    // No extra PRNG calls, preserving previous gold/potion RNG sequences.
    const earnedFragment=p.kills%2===0 && p.armor!.fragments<1000000;
    const eliteFragment=elite && p.armor!.fragments<999998 ? 2 : 0;
    if(earnedFragment && p.armor!.fragments<1000000) p.armor!.fragments++;
    if(eliteFragment) p.armor!.fragments+=eliteFragment;
    if (this.random() < .3) p.potions++;
    const kind:HuntKind=m.name==='숲의 정예 감시자'?'sentinel':m.npcId===20001?'slime':'wanderer';
    const advanced=recordQuestKill(p.quest!,kind);
    this.message = `${m.name} 처치 · 경험치 +${elite?75:30} · 골드 +${gold}${earnedFragment||eliteFragment?' · 방어구 파편 +'+(Number(earnedFragment)+eliteFragment):''}${advanced?' · '+questSummary(p.quest!):''}`;this.emit({kind:'loot',x:m.x,z:m.z,amount:gold,text:this.message});
    while (p.level < 100 && p.xp >= xpNeeded(p)) { p.xp -= xpNeeded(p); p.level++; p.hp = maxHp(p); p.mp = 60; this.message = `레벨 ${p.level} 달성! 체력과 마나가 회복되었습니다.`;this.emit({kind:'level',x:p.x,z:p.z,amount:p.level,text:this.message}); }
    if (p.level === 100) p.xp = Math.min(p.xp, xpNeeded(p) - 1);
    this.attacking = false; this.target = null;
  }
  tick(dt: number): void {
    if (!Number.isFinite(dt) || dt <= 0 || dt > .25) return;
    this.clock += dt; const p = this.state.player;
    this.state.territory.stored = Math.min(120, this.state.territory.stored + this.state.territory.garden * dt / 8);
    this.regen += dt; if (this.regen >= 2) { this.regen -= 2; p.mp = Math.min(60, p.mp + 1); if (Math.hypot(p.x, p.z) < 24) p.hp = Math.min(maxHp(p), p.hp + 3); }
    if (this.clock >= this.actionUntil) this.action = EntityAction.None;
    const target = this.mobs.find(m => m.id === this.target && m.hp > 0);
    if (this.attacking && target) {
      if (Math.hypot(p.x - target.x, p.z - target.z) > 2.8) { if (this.movement.waypointIndex >= this.movement.waypoints.length) this.move(target.x, target.z); }
      else { this.movement = createPathMoveState(p.x, snapEntityY(p.x, p.z), p.z); if (this.clock >= this.attackAt) { this.attackAt = this.clock + .8; this.action = EntityAction.Attack; this.actionSeq++; this.actionUntil = this.clock + .5; this.damage(target, attackPower(p)); } }
    }
    this.movement = stepAlongPath(this.movement, null, dt, 9);
    p.x = this.movement.x; p.z = this.movement.z;
    for (const m of this.mobs) {
      if (!m.hp) { if (this.clock >= m.respawn) { m.hp = m.maxHp; m.x = m.homeX; m.z = m.homeZ; m.action = 0; m.actionSeq++; } continue; }
      if (Math.hypot(m.x - p.x, m.z - p.z) < 3.5 && Math.hypot(p.x, p.z) > 24 && this.clock >= m.cooldown) {
        const taken=Math.min(p.hp,Math.max(1,7-armorDefense(p.armor)));p.hp -= taken;this.emit({kind:'hurt',x:p.x,z:p.z,amount:taken,text:`${m.name}에게 ${taken} 피해를 받았습니다.`}); m.cooldown = this.clock + 1.4; m.action = EntityAction.Attack; m.actionSeq++;
        if (!p.hp) { const lost = Math.min(p.gold, 5); p.gold -= lost; this.dispatch({ type: 'recall' }); this.message = `쓰러졌습니다. 마을에서 회복했습니다. 골드 -${lost}`; break; }
      } else if (this.clock >= m.cooldown - .8) m.action = 0;
    }
  }
}
