import { classicIcon } from './classic-icons';
import { maxHp, attackPower, isWeaponEquipped, type Player, type Intent } from './session';

type Item = 'weapon' | 'potion' | 'wood';
export function createInventoryWindow(host: HTMLElement, getPlayer: () => Player, action: (intent: Intent) => void, openShop: () => void) {
  let selected: Item = 'weapon', filter = 'all', signature = '';
  const details = (p: Player) => ({
    weapon: { name: `여행자의 무기 +${p.weapon}`, icon: 'sword', tag: `일반 · 무기 · ${isWeaponEquipped(p)?'착용 중':'미착용'}`, info: `무기 공격력 +${6+p.weapon*4}`, description: '모험을 함께하는 기본 무기입니다. 강화하면 공격력이 4 증가합니다.', count: 1 },
    potion: { name: '회복 물약', icon: 'potion', tag: '일반 · 소모품', info: '체력 55 회복', description: '현재 체력을 최대 체력까지 회복합니다. 단축키 3으로도 사용할 수 있습니다.', count: p.potions },
    wood: { name: '목재', icon: 'wood', tag: '일반 · 재료', info: `보유 ${p.wood}개`, description: '마을 주변에서 채집하거나 사냥으로 얻습니다. 영지 정원의 건설과 확장에 사용합니다.', count: p.wood },
  });
  function render(force = false) {
    const p=getPlayer(), next=JSON.stringify([p.weapon,p.weaponEquipped,p.level,p.gold,p.potions,p.wood,p.hp,filter,selected]);
    if (!force && signature===next) return; signature=next;
    const items=details(p), item=items[selected];
    host.innerHTML=`<div class="inventory-heading"><span class="eyebrow">CHARACTER & INVENTORY</span><h2>장비와 소지품</h2></div>
      <div class="inventory-columns"><section class="equipment-sheet" aria-label="착용 장비"><h3>착용 장비 <span>Lv. ${p.level}</span></h3>
      <div class="paper-doll"><div class="gear-empty gear-head" title="머리 장비 없음">머리</div><div class="gear-empty gear-body" title="몸통 장비 없음">몸통</div><div class="gear-empty gear-feet" title="발 장비 없음">발</div><button class="gear-weapon" data-item="weapon" title="${isWeaponEquipped(p)?'착용 중인 무기':'미착용 무기'} 정보">${isWeaponEquipped(p)?classicIcon('sword'):'무기'}<small>${isWeaponEquipped(p)?'+'+p.weapon:''}</small></button><div class="gear-empty gear-offhand">보조</div><div class="doll-outline" aria-hidden="true"><svg viewBox="0 0 120 240"><circle cx="60" cy="30" r="18"/><path d="M40 55 20 68 8 132 25 138 42 95 38 145 32 220 52 220 60 160 68 220 88 220 82 145 78 95 95 138 112 132 100 68 80 55Z"/></svg></div></div>
      <div class="stat-line">공격력 <b>${attackPower(p)}</b></div><div class="stat-line">최대 체력 <b>${maxHp(p)}</b></div><div class="stat-line">무기 강화 <b>+${p.weapon} / 20</b></div><p class="equipment-note">${isWeaponEquipped(p)?'기본 무기 착용 중':'무기 미착용 · 맨손 공격'}<br>빈 부위에는 아직 장비가 없습니다.</p><a class="armor-preview-link" href="./art-lab.html" target="_blank" rel="noopener noreferrer">3D 외형·무기 비교 ↗</a><p class="equipment-note">외형 비교실은 시험용이며 실제 방어구 소유나 전투 능력치를 변경하지 않습니다.</p></section>
      <section class="bag-sheet" aria-label="소지품"><div class="bag-title"><h3>소지품</h3><span>${1+Number(p.potions>0)+Number(p.wood>0)} / 24 슬롯</span></div><nav class="bag-filters" aria-label="소지품 분류">${[['all','전체'],['weapon','장비'],['potion','소모품'],['wood','재료']].map(([id,label])=>`<button data-filter="${id}" aria-pressed="${filter===id}">${label}</button>`).join('')}</nav>
      <div class="bag-grid" aria-label="소지품 슬롯">${Array.from({length:24},(_,i)=>{const id=(['weapon','potion','wood'] as Item[]).filter(id=>items[id].count>0&&(filter==='all'||filter===id))[i];return id?`<button data-item="${id}" class="item-slot ${id===selected?'selected':''}" title="${items[id].name} · ${items[id].info}" aria-label="${items[id].name}, ${items[id].count}개" aria-pressed="${id===selected}">${classicIcon(items[id].icon)}<small>${id==='weapon'?(isWeaponEquipped(p)?'E':'1'):items[id].count}</small></button>`:`<div class="item-slot empty" aria-hidden="true"></div>`;}).join('')}</div>
      <div class="bag-wallet"><span>보유 골드</span><b>${p.gold.toLocaleString()}</b></div><button id="open-shop">마을 보급 상점</button></section></div>
      <section class="item-detail" aria-label="선택 아이템 정보"><div class="item-detail-icon">${classicIcon(item.icon)}</div><div><small>${item.tag}</small><h3>${item.name}</h3><strong>${item.info}</strong><p>${item.description}</p></div></section>
      <div class="inventory-action">${selected==='weapon'?`<div class="equipment-comparison">공격력 <b>${attackPower(p)}</b> → <b>${attackPower({...p,weaponEquipped:!isWeaponEquipped(p)})}</b> <span>${isWeaponEquipped(p)?'해제 시':'장착 시'}</span></div><button id="toggle-equipment">${isWeaponEquipped(p)?'무기 해제':'무기 장착'}</button><button id="upgrade" ${p.weapon>=20||p.gold<20*(p.weapon+1)?'disabled':''}>${p.weapon>=20?'최고 강화 단계':`무기 강화 · ${20*(p.weapon+1)} 골드`}</button><small>성공 확률 100% · 무기 공격력 +4 (장착 시 적용)</small>`:selected==='potion'?`<button id="use-item" ${p.potions<1||p.hp>=maxHp(p)?'disabled':''}>회복 물약 사용</button><small>${p.hp>=maxHp(p)?'체력이 가득 찼습니다.':`현재 체력 ${p.hp} / ${maxHp(p)}`}</small>`:'<small>목재는 영지 관리에서 정원 건설에 사용합니다.</small>'}</div>`;
    host.querySelectorAll<HTMLButtonElement>('[data-item]').forEach(b=>b.onclick=()=>{selected=b.dataset['item'] as Item;render(true);if(innerWidth<=550)host.querySelector<HTMLElement>('.item-detail')?.scrollIntoView({block:'nearest'});});
    host.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset['filter']!;render(true);});
    host.querySelector<HTMLButtonElement>('#toggle-equipment')?.addEventListener('click',()=>{action({type:isWeaponEquipped(getPlayer())?'unequip-weapon':'equip-weapon'});render(true);});
    host.querySelector<HTMLButtonElement>('#upgrade')?.addEventListener('click',()=>{action({type:'upgrade'});render(true);});
    host.querySelector<HTMLButtonElement>('#use-item')?.addEventListener('click',()=>{action({type:'potion'});render(true);});
    host.querySelector<HTMLButtonElement>('#open-shop')!.onclick=openShop;
  }
  render(); return { refresh:()=>render() };
}
