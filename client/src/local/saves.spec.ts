import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
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
});
