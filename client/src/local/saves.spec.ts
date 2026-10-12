import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readSave, writeSave } from './saves';
import { newSave } from './session';
beforeEach(async()=>{await new Promise<void>((resolve,reject)=>{const r=indexedDB.deleteDatabase('dream-library-local-v1');r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error);});});
describe('IndexedDB persistence contract',()=>{
  it('commits a save, reads it back, and preserves the previous committed slot',async()=>{
    const first=newSave('첫 여행자',0);await writeSave(first);
    expect((await readSave())?.player.name).toBe('첫 여행자');
    const second=newSave('두 번째',10);second.player.gold=123;await writeSave(second);
    expect((await readSave())?.player.gold).toBe(123);expect((await readSave('backup'))?.player.name).toBe('첫 여행자');
  });
  it('rejects invalid saves before replacing the valid slot',async()=>{
    const first=newSave('여행자',0);await writeSave(first);
    await expect(writeSave({...first,schemaVersion:9} as never)).rejects.toThrow();
    expect((await readSave())?.player.name).toBe('여행자');
  });
  it('keeps the valid backup when recovering a corrupt current slot',async()=>{
    await writeSave(newSave('정상 백업',0));await writeSave(newSave('현재 기록',0));
    await new Promise<void>((resolve,reject)=>{const r=indexedDB.open('dream-library-local-v1');r.onsuccess=()=>{const db=r.result,tx=db.transaction('saves','readwrite');tx.objectStore('saves').put({schemaVersion:999},'current');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};r.onerror=()=>reject(r.error);});
    await expect(readSave()).rejects.toThrow();const backup=await readSave('backup');await writeSave(backup!);
    expect((await readSave())?.player.name).toBe('정상 백업');expect((await readSave('backup'))?.player.name).toBe('정상 백업');
  });
  it('opens a previous 0.1.0 save without resetting progress',async()=>{
    const legacy=newSave('기존 모험가',18);legacy.gameVersion='0.1.0';legacy.player.gold=321;legacy.player.weapon=2;legacy.territory.garden=2;
    await writeSave(legacy);const restored=await readSave();expect(restored?.player.gold).toBe(321);expect(restored?.player.weapon).toBe(2);expect(restored?.territory.garden).toBe(2);
  });
});

it('round trips unequipped enhancement without granting a duplicate item',async()=>{
  const s=newSave('장비 복원',0);s.player.weapon=3;s.player.weaponEquipped=false;await writeSave(s);
  const copy=await readSave();expect(copy?.player.weapon).toBe(3);expect(copy?.player.weaponEquipped).toBe(false);
});

it('round-trips a mixed equipped four-slot armor kit through IndexedDB schema v1',async()=>{
  const save=newSave('방어구 기록',0);
  save.player.armor!.fragments=7;
  save.player.armor!.owned={helmet:3,body:1,gloves:2,boots:3};
  save.player.armor!.equipped={helmet:2,body:1,gloves:2,boots:0};
  await writeSave(save);
  const restored=await readSave();
  expect(restored?.schemaVersion).toBe(1);
  expect(restored?.player.armor).toEqual(save.player.armor);
  expect(restored?.player.weaponEquipped).toBe(true);
  expect(restored?.player.potions).toBe(5);
});

it('preserves claimed quest stages in IndexedDB and migrates legacy missing quest',async()=>{
  const save=newSave('의뢰 기록',0);
  save.player.quest={stage:1,progress:2};
  await writeSave(save);
  const restored=await readSave();
  expect(restored?.player.quest).toEqual({stage:1,progress:2});
  const older=newSave('옛 모험가',0);
  delete older.player.quest;
  await writeSave(older);
  const migrated=await readSave();
  expect(migrated?.schemaVersion).toBe(1);
  expect(migrated?.player.quest).toEqual({stage:0,progress:0});
  expect((await readSave('backup'))?.player.quest).toEqual({stage:1,progress:2});
});

it('aborts the full transaction on a synchronous current-slot write failure and allows retry',async()=>{
 const first=newSave('저장 보호',0);first.player.gold=11;await writeSave(first);
 const next=newSave('종료 저장',0);next.player.gold=43;
 const original=IDBObjectStore.prototype.put;
 const spy=vi.spyOn(IDBObjectStore.prototype,'put').mockImplementation(function(this:IDBObjectStore,value:unknown,key?:IDBValidKey){if(key==='current')throw new DOMException('quota fixture','QuotaExceededError');return original.call(this,value,key);});
 try{await expect(writeSave(next)).rejects.toThrow('quota fixture');}finally{spy.mockRestore();}
 expect((await readSave())?.player.gold).toBe(11);expect(await readSave('backup')).toBeNull();
 await writeSave(next);expect((await readSave())?.player.gold).toBe(43);expect((await readSave('backup'))?.player.gold).toBe(11);
});
