import 'fake-indexeddb/auto';
import {beforeEach,describe,it,expect} from 'vitest';
import {createLatestSaveQueue} from './latest-save-queue';
import {readSave,writeSave} from './saves';
import {newSave,type Save} from './session';
const deferred=()=>{let resolve!:()=>void;const promise=new Promise<void>(r=>resolve=r);return {promise,resolve};};
beforeEach(async()=>{await new Promise<void>((resolve,reject)=>{const r=indexedDB.deleteDatabase('dream-library-local-v1');r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error);});});
describe('latest requested save survives delayed persistence',()=>{
  it('commits first and latest snapshots serially and restores actual IndexedDB state',async()=>{
    const gate=deferred(),writes:number[]=[];
    const q=createLatestSaveQueue<Save>(async s=>{writes.push(s.player.gold);if(writes.length===1)await gate.promise;await writeSave(s);});
    const a=newSave('연속 저장',0);a.player.gold=10;
    const first=q.request(a);a.player.gold=20;const middle=q.request(a);a.player.gold=30;a.player.weaponEquipped=false;const latest=q.request(a);
    let settled=false;void first.then(()=>settled=true);await Promise.resolve();expect(settled).toBe(false);expect(writes).toEqual([10]);
    gate.resolve();await Promise.all([first,middle,latest]);
    expect(writes).toEqual([10,30]);expect((await readSave())?.player.gold).toBe(30);expect((await readSave())?.player.weaponEquipped).toBe(false);expect((await readSave('backup'))?.player.gold).toBe(10);
  });
  it('does not mutate an in-flight snapshot when its source object changes',async()=>{
    const gate=deferred();let stored=0;const q=createLatestSaveQueue<{gold:number}>(async s=>{await gate.promise;stored=s.gold;});const input={gold:3};const save=q.request(input);input.gold=99;gate.resolve();await save;expect(stored).toBe(3);
  });
  it('rejects queued callers together after a failed write, then permits a real retry',async()=>{
    const gate=deferred();let fail=true;const q=createLatestSaveQueue<Save>(async s=>{await gate.promise;if(fail)throw Error('quota');await writeSave(s);});
    const first=q.request(newSave('처음',0)),last=q.request(newSave('나중',0));const failures=Promise.allSettled([first,last]);gate.resolve();expect((await failures).map(r=>r.status)).toEqual(['rejected','rejected']);expect(await readSave()).toBeNull();fail=false;await q.request(newSave('재시도',0));expect((await readSave())?.player.name).toBe('재시도');
  });
  it('starts another drain after completion and recovers from synchronous writer errors',async()=>{
    let fail=true;const writes:number[]=[];const q=createLatestSaveQueue<number>(value=>{if(fail)throw Error('sync');writes.push(value);return Promise.resolve();});await expect(q.request(1)).rejects.toThrow('sync');fail=false;await q.request(2);await q.request(3);expect(writes).toEqual([2,3]);
  });
});
