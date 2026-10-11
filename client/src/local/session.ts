import { createPathMoveState, stepAlongPath, findPath, snapToNearestWalkable, snapEntityY, EntityAction, type PathMoveState } from '@nj/game-core';

export const GAME_VERSION = '0.1.0';
export interface Player { name: string; classId: number; x: number; z: number; hp: number; mp: number; level: number; xp: number; gold: number; wood: number; potions: number; weapon: number; kills: number }
export interface Save { schemaVersion: 1; gameVersion: string; updatedAt: number; seed: number; player: Player; territory: { hall: number; garden: number; stored: number } }
export interface Mob { id: string; npcId: number; name: string; x: number; z: number; homeX: number; homeZ: number; hp: number; maxHp: number; respawn: number; action: number; actionSeq: number; cooldown: number }
export type Intent = { type: 'move'; x: number; z: number } | { type: 'target'; id: string } | { type: 'attack' | 'skill' | 'potion' | 'recall' | 'upgrade' | 'gather' | 'garden' | 'collect' };
export interface GameSession { readonly mode: 'local' | 'online'; dispatch(intent: Intent): void; tick(dt: number): void; snapshot(): Save }
export const maxHp = (p: Player) => 100 + (p.level - 1) * 18;
export const xpNeeded = (p: Player) => 60 + (p.level - 1) * 30;
export function newSave(name: string, classId: number): Save {
  return { schemaVersion: 1, gameVersion: GAME_VERSION, updatedAt: 0, seed: 20261011,
    player: { name: name.trim().slice(0, 20) || '모험가', classId, x: 0, z: 0, hp: 100, mp: 60, level: 1, xp: 0, gold: 0, wood: 0, potions: 5, weapon: 0, kills: 0 },
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
  return structuredClone(s);
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
      this.mobs.push({ id: `local-${i}`, npcId: i % 3 === 0 ? 20001 : 20003, name: i % 3 === 0 ? '잉크 슬라임' : '숲의 방랑자', ...spot, homeX: spot.x, homeZ: spot.z, hp: 45, maxHp: 45, respawn: 0, action: 0, actionSeq: 0, cooldown: 0 });
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
    if (intent.type === 'move') { this.attacking = false; this.move(intent.x, intent.z); }
    if (intent.type === 'target') { this.target = this.mobs.some(m => m.id === intent.id && m.hp > 0) ? intent.id : null; this.attacking = false; }
    if (intent.type === 'attack') { this.attacking = !this.attacking; if (!this.target) { this.attacking = false; this.message = '먼저 몬스터를 선택하세요.'; } }
    if (intent.type === 'skill') {
      const m = this.mobs.find(m => m.id === this.target && m.hp > 0);
      if (!m) this.message = '먼저 몬스터를 선택하세요.';
      else if (Math.hypot(m.x - p.x, m.z - p.z) > 12) this.message = '스킬 사거리가 닿지 않습니다.';
      else if (this.clock < this.skillAt) this.message = '별빛 참격을 준비하고 있습니다.';
      else if (p.mp < 12) this.message = '마나가 부족합니다.';
      else { p.mp -= 12; this.skillAt = this.clock + 4; this.action = EntityAction.Cast; this.actionSeq++; this.actionUntil = this.clock + .7; this.damage(m, 27 + p.weapon * 4 + p.level * 3); }
    }
    if (intent.type === 'potion') { if (p.potions && p.hp < maxHp(p)) { p.potions--; p.hp = Math.min(maxHp(p), p.hp + 55); this.message = '회복 물약을 사용했습니다.'; } else this.message = '물약이 없거나 체력이 가득 찼습니다.'; }
    if (intent.type === 'recall') { p.x = 0; p.z = 0; p.hp = maxHp(p); p.mp = 60; this.movement = createPathMoveState(); this.attacking = false; this.target = null; this.message = '안전한 마을로 귀환했습니다.'; }
    if (intent.type === 'upgrade') { const cost = 20 * (p.weapon + 1); if (p.weapon >= 20) this.message = '최고 강화 단계입니다.'; else if (p.gold < cost) this.message = `강화에는 골드 ${cost}개가 필요합니다.`; else { p.gold -= cost; p.weapon++; this.message = `여행자의 무기를 +${p.weapon}로 강화했습니다.`; } }
    if (intent.type === 'gather') { if (Math.hypot(p.x, p.z) > 24) this.message = '채집은 마을 주변에서 할 수 있습니다.'; else if (this.clock < this.attackAt) this.message = '잠시 후 다시 채집하세요.'; else { p.wood += 3; this.attackAt = this.clock + 2; this.message = '마을 주변에서 목재 3개를 모았습니다.'; } }
    if (intent.type === 'garden') { const t = this.state.territory, cost = 12 + t.garden * 6; if (t.garden >= 5) this.message = '정원은 최고 단계입니다.'; else if (p.wood < cost) this.message = `정원 확장에는 목재 ${cost}개가 필요합니다.`; else { p.wood -= cost; t.garden++; this.message = '영지 정원을 확장했습니다. 플레이 중 골드를 생산합니다.'; } }
    if (intent.type === 'collect') { const t = this.state.territory, amount = Math.floor(t.stored + 1e-9); p.gold += amount; t.stored = Math.max(0, t.stored - amount); this.message = amount ? `정원에서 골드 ${amount}개를 수확했습니다.` : '정원이 생산 중입니다.'; }
  }
  private damage(m: Mob, amount: number): void {
    m.hp = Math.max(0, m.hp - amount); this.message = `${m.name}에게 ${amount} 피해`;
    if (m.hp !== 0) return;
    m.action = EntityAction.Die; m.actionSeq++; m.respawn = this.clock + 15;
    const p = this.state.player, gold = 8 + Math.floor(this.random() * 7);
    p.gold += gold; p.xp += 30; p.kills++; p.wood += 1;
    if (this.random() < .3) p.potions++;
    this.message = `${m.name} 처치 · 경험치 +30 · 골드 +${gold}`;
    while (p.level < 100 && p.xp >= xpNeeded(p)) { p.xp -= xpNeeded(p); p.level++; p.hp = maxHp(p); p.mp = 60; this.message = `레벨 ${p.level}! 마을의 골드가 깨어납니다.`; }
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
      else { this.movement = createPathMoveState(p.x, snapEntityY(p.x, p.z), p.z); if (this.clock >= this.attackAt) { this.attackAt = this.clock + .8; this.action = EntityAction.Attack; this.actionSeq++; this.actionUntil = this.clock + .5; this.damage(target, 10 + p.level * 2 + p.weapon * 4); } }
    }
    this.movement = stepAlongPath(this.movement, null, dt, 9);
    p.x = this.movement.x; p.z = this.movement.z;
    for (const m of this.mobs) {
      if (!m.hp) { if (this.clock >= m.respawn) { m.hp = m.maxHp; m.x = m.homeX; m.z = m.homeZ; m.action = 0; m.actionSeq++; } continue; }
      if (Math.hypot(m.x - p.x, m.z - p.z) < 3.5 && Math.hypot(p.x, p.z) > 24 && this.clock >= m.cooldown) {
        p.hp = Math.max(0, p.hp - 7); m.cooldown = this.clock + 1.4; m.action = EntityAction.Attack; m.actionSeq++;
        if (!p.hp) { const lost = Math.min(p.gold, 5); p.gold -= lost; this.dispatch({ type: 'recall' }); this.message = `쓰러졌습니다. 마을에서 회복했습니다. 골드 -${lost}`; break; }
      } else if (this.clock >= m.cooldown - .8) m.action = 0;
    }
  }
}
