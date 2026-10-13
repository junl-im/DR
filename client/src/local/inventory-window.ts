import { classicIcon } from './classic-icons';
import { maxHp, attackPower, isWeaponEquipped, type Player, type Intent } from './session';
import { ARMOR_SLOTS, ARMOR_LABELS, ARMOR_TIER_LABELS, armorCraftCost, armorDefense, readArmor, ownsArmor, type ArmorSlot, type CraftedArmorTier } from './armor-economy';

type Item = 'weapon' | 'potion' | 'wood';
export function createInventoryWindow(host: HTMLElement, getPlayer: () => Player, action: (intent: Intent) => void, openShop: () => void) {
  let selected: Item = 'weapon', filter = 'all', signature = '';
  const details = (p: Player) => ({
    weapon: { name: `여행자의 무기 +${p.weapon}`, icon: 'sword' as const, tag: `일반 · 무기 · ${isWeaponEquipped(p)?'착용 중':'미착용'}`, info: `무기 공격력 +${6+p.weapon*4}`, description: '모험을 함께하는 기본 무기입니다. 강화하면 공격력이 4 증가합니다.', count: 1 },
    potion: { name: '회복 물약', icon: 'potion' as const, tag: '일반 · 소모품', info: '체력 55 회복', description: '현재 체력을 최대 체력까지 회복합니다. 단축키 3으로도 사용할 수 있습니다.', count: p.potions },
    wood: { name: '목재', icon: 'wood' as const, tag: '일반 · 재료', info: `보유 ${p.wood}개`, description: '마을 주변에서 채집하거나 사냥으로 얻습니다. 영지 정원의 건설과 확장에 사용합니다.', count: p.wood },
  });
  function render(force = false) {
    const p=getPlayer(), armor=readArmor(p.armor), next=JSON.stringify([p.weapon,p.weaponEquipped,p.level,p.gold,p.potions,p.wood,p.hp,armor,filter,selected]);
    if (!force && signature===next) return; signature=next;
    const items=details(p), item=items[selected];
    const armorBag=ARMOR_SLOTS.flatMap(slot=>
      ([1,2] as CraftedArmorTier[]).filter(tier=>ownsArmor(armor,slot,tier)).map(tier=>({slot,tier}))
    ).filter(()=>filter==='all'||filter==='weapon');
    const regularBag=(['weapon','potion','wood'] as Item[]).filter(
      id=>items[id].count>0&&(filter==='all'||filter===id)
    );
    const armorRows=ARMOR_SLOTS.map(slot=>{
      const equipped=armor.equipped[slot];
      const options=([1,2] as CraftedArmorTier[]).map(tier=>{
        const owned=ownsArmor(armor,slot,tier), cost=armorCraftCost(tier), name=ARMOR_TIER_LABELS[tier];
        return owned ? `<button data-equip-armor="${slot}:${tier}" ${equipped===tier?'disabled':''}>${equipped===tier?'착용 중':name+' 착용'}</button>` : `<button data-craft-armor="${slot}:${tier}" title="골드 ${cost.gold} · 목재 ${cost.wood} · 파편 ${cost.fragments}">${name} 제작</button>`;
      }).join('');
      return `<div class="armor-slot-row"><b>${ARMOR_LABELS[slot]}</b><span>${equipped?ARMOR_TIER_LABELS[equipped]:'미착용'}</span>${options}<button data-unequip-armor="${slot}" ${!equipped?'disabled':''}>해제</button></div>`;
    }).join('');
    host.innerHTML=`<div class="inventory-heading"><span class="eyebrow">CHARACTER & INVENTORY</span><h2>장비와 소지품</h2></div>
      <div class="inventory-columns"><section class="equipment-sheet" aria-label="착용 장비"><h3>착용 장비 <span>Lv. ${p.level}</span></h3>
      <div class="paper-doll"><div class="gear-empty gear-head" title="${armor.equipped.helmet?ARMOR_TIER_LABELS[armor.equipped.helmet]+' 머리 착용':'머리 장비 없음'}">${armor.equipped.helmet?ARMOR_TIER_LABELS[armor.equipped.helmet]: '머리'}</div><div class="gear-empty gear-body" title="${armor.equipped.body?ARMOR_TIER_LABELS[armor.equipped.body]+' 몸통 착용':'몸통 장비 없음'}">${armor.equipped.body?ARMOR_TIER_LABELS[armor.equipped.body]: '몸통'}</div><div class="gear-empty gear-feet" title="${armor.equipped.boots?ARMOR_TIER_LABELS[armor.equipped.boots]+' 발 착용':'발 장비 없음'}">${armor.equipped.boots?ARMOR_TIER_LABELS[armor.equipped.boots]: '발'}</div><button class="gear-weapon" data-item="weapon" title="${isWeaponEquipped(p)?'착용 중인 무기':'미착용 무기'} 정보">${isWeaponEquipped(p)?classicIcon('sword'):'무기'}<small>${isWeaponEquipped(p)?'+'+p.weapon:''}</small></button><div class="gear-empty gear-offhand">보조</div><div class="doll-outline" aria-hidden="true"><svg viewBox="0 0 120 240"><ellipse cx="60" cy="125" rx="46" ry="107" fill="none" stroke-opacity=".18"/><path d="M60 9 77 19 79 39 69 51H51L41 39 43 19Z M44 24H76 M48 35H72 M60 24V44"/><path d="M43 56 25 63 14 84 20 117 30 119 39 85 40 126 34 157 43 163 47 214 57 220 60 166 63 220 73 214 77 163 86 157 80 126 81 85 90 119 100 117 106 84 95 63 77 56 60 66Z"/><path d="M26 63 40 76 60 83 80 76 94 63 M40 126 60 137 80 126 M43 163 60 153 77 163 M47 214 39 229H57V220 M73 214 81 229H63V220 M47 90 60 97 73 90 M49 108 60 114 71 108" fill="none"/><path d="M14 84 8 123 16 139 27 135 30 119 M106 84 112 123 104 139 93 135 90 119"/></svg></div></div>
      <div class="stat-line">공격력 <b>${attackPower(p)}</b></div><div class="stat-line">최대 체력 <b>${maxHp(p)}</b></div><div class="stat-line">무기 강화 <b>+${p.weapon} / 20</b></div><p class="equipment-note">${isWeaponEquipped(p)?'기본 무기 착용 중':'무기 미착용 · 맨손 공격'}<br>빈 부위에는 아직 장비가 없습니다.</p><section class="armor-crafting" aria-label="방어구 제작과 착용"><h3>방어구 · 방어력 ${armorDefense(armor)}</h3><small>파편 ${armor.fragments}개 · 사냥 2회마다 1개 획득 · 마을 상점 근처 제작</small>${armorRows}</section></section>
      <section class="bag-sheet" aria-label="소지품"><div class="bag-title"><h3>소지품</h3><span>${regularBag.length+armorBag.length} / 24 슬롯</span></div><nav class="bag-filters" aria-label="소지품 분류">${[['all','전체'],['weapon','장비'],['potion','소모품'],['wood','재료']].map(([id,label])=>`<button data-filter="${id}" aria-pressed="${filter===id}">${label}</button>`).join('')}</nav>
      <div class="bag-grid" aria-label="소지품 슬롯">${Array.from({length:24},(_,i)=>{const id=regularBag[i], worn=armorBag[i-regularBag.length];return worn?`<button data-armor-bag="${worn.slot}:${worn.tier}" class="item-slot" title="${ARMOR_TIER_LABELS[worn.tier]} ${ARMOR_LABELS[worn.slot]} · ${armor.equipped[worn.slot]===worn.tier?'착용 중':'미착용'}">${classicIcon('armor')}<small>${armor.equipped[worn.slot]===worn.tier?'E':'1'}</small></button>`:id?`<button data-item="${id}" class="item-slot ${id===selected?'selected':''}" title="${items[id].name} · ${items[id].info}" aria-label="${items[id].name}, ${items[id].count}개" aria-pressed="${id===selected}">${classicIcon(items[id].icon)}<small>${id==='weapon'?(isWeaponEquipped(p)?'E':'1'):items[id].count}</small></button>`:`<div class="item-slot empty" aria-hidden="true"></div>`;}).join('')}</div>
      <div class="bag-wallet"><span>보유 골드</span><b>${p.gold.toLocaleString()}</b></div><button id="open-shop">마을 보급 상점</button></section></div>
      <section class="item-detail" aria-label="선택 아이템 정보"><div class="item-detail-icon">${classicIcon(item.icon)}</div><div><small>${item.tag}</small><h3>${item.name}</h3><strong>${item.info}</strong><p>${item.description}</p></div></section>
      <div class="inventory-action">${selected==='weapon'?`<div class="equipment-comparison">공격력 <b>${attackPower(p)}</b> → <b>${attackPower({...p,weaponEquipped:!isWeaponEquipped(p)})}</b> <span>${isWeaponEquipped(p)?'해제 시':'장착 시'}</span></div><button id="toggle-equipment">${isWeaponEquipped(p)?'무기 해제':'무기 장착'}</button><button id="upgrade" ${p.weapon>=20||p.gold<20*(p.weapon+1)?'disabled':''}>${p.weapon>=20?'최고 강화 단계':`무기 강화 · ${20*(p.weapon+1)} 골드`}</button><small>성공 확률 100% · 무기 공격력 +4 (장착 시 적용)</small>`:selected==='potion'?`<button id="use-item" ${p.potions<1||p.hp>=maxHp(p)?'disabled':''}>회복 물약 사용</button><small>${p.hp>=maxHp(p)?'체력이 가득 찼습니다.':`현재 체력 ${p.hp} / ${maxHp(p)}`}</small>`:'<small>목재는 영지 관리에서 정원 건설에 사용합니다.</small>'}</div>`;
    // Keep the selected item and its actions beside the bag, ahead of crafting.
    const bag=host.querySelector('.bag-sheet')!;
    for(const selector of ['.item-detail','.inventory-action'])bag.append(host.querySelector(selector)!);
    bag.append(host.querySelector('#open-shop')!);
    host.querySelectorAll<HTMLButtonElement>('[data-item]').forEach(b=>b.onclick=()=>{selected=b.dataset['item'] as Item;render(true);if(innerWidth<=550)host.querySelector<HTMLElement>('.item-detail')?.scrollIntoView({block:'nearest'});});
    host.querySelectorAll<HTMLButtonElement>('[data-armor-bag]').forEach(b=>b.onclick=()=>{
      const [slot,raw]=b.dataset['armorBag']!.split(':');
      const tier=Number(raw) as CraftedArmorTier;
      action(armor.equipped[slot as ArmorSlot]===tier?
        {type:'unequip-armor',slot:slot as ArmorSlot}:
        {type:'equip-armor',slot:slot as ArmorSlot,tier});
      render(true);
    });
    host.querySelectorAll<HTMLButtonElement>('[data-craft-armor]').forEach(b=>b.onclick=()=>{
      const [slot,raw]=b.dataset['craftArmor']!.split(':');
      action({type:'craft-armor',slot:slot as ArmorSlot,tier:Number(raw) as CraftedArmorTier});render(true);
    });
    host.querySelectorAll<HTMLButtonElement>('[data-equip-armor]').forEach(b=>b.onclick=()=>{
      const [slot,raw]=b.dataset['equipArmor']!.split(':');
      action({type:'equip-armor',slot:slot as ArmorSlot,tier:Number(raw) as CraftedArmorTier});render(true);
    });
    host.querySelectorAll<HTMLButtonElement>('[data-unequip-armor]').forEach(b=>b.onclick=()=>{
      action({type:'unequip-armor',slot:b.dataset['unequipArmor'] as ArmorSlot});render(true);
    });
    host.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset['filter']!;render(true);});
    host.querySelector<HTMLButtonElement>('#toggle-equipment')?.addEventListener('click',()=>{action({type:isWeaponEquipped(getPlayer())?'unequip-weapon':'equip-weapon'});render(true);});
    host.querySelector<HTMLButtonElement>('#upgrade')?.addEventListener('click',()=>{action({type:'upgrade'});render(true);});
    host.querySelector<HTMLButtonElement>('#use-item')?.addEventListener('click',()=>{action({type:'potion'});render(true);});
    host.querySelector<HTMLButtonElement>('#open-shop')!.onclick=openShop;
  }
  render(); return { refresh:()=>render() };
}
