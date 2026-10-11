import { validateSave, type Save } from './session';
const DB = 'dream-library-local-v1';
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('saves');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('다른 탭을 닫은 뒤 저장을 다시 시도해주세요.'));
  });
}
export async function readSave(slot = 'current'): Promise<Save | null> {
  const db = await open();
  try { return await new Promise((resolve, reject) => {
    const req = db.transaction('saves').objectStore('saves').get(slot);
    req.onsuccess = () => { try { resolve(req.result ? validateSave(req.result) : null); } catch (e) { reject(e); } };
    req.onerror = () => reject(req.error);
  }); } finally { db.close(); }
}
export async function writeSave(save: Save): Promise<void> {
  const copy = validateSave({ ...save, updatedAt: Date.now() });
  const db = await open();
  try { await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('saves', 'readwrite'), store = tx.objectStore('saves');
    const previous = store.get('current');
    previous.onsuccess = () => { if (previous.result) { try { store.put(validateSave(previous.result), 'backup'); } catch { /* Keep the last valid backup when recovering a corrupt current slot. */ } } store.put(copy, 'current'); };
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error ?? new Error('저장이 취소되었습니다.'));
  }); } finally { db.close(); }
}
