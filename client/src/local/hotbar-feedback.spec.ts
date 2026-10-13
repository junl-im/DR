import {it,expect,describe,vi,afterEach} from 'vitest';
import {bindHotbarClickFeedback,flashActionSlot} from './hotbar-feedback';
afterEach(()=>{document.body.innerHTML='';vi.useRealTimers();});
describe('hotbar acknowledgement',()=>{
 it('pressing a hotbar icon flashes only that action, not unrelated windows',()=>{
  document.body.innerHTML='<main><nav class="actions"><button id="attack"><span>Attack</span></button><button id="potion">Potion</button></nav><button id="options">Menu</button></main>';
  const root=document.querySelector('main')!;
  const cleanup=bindHotbarClickFeedback(root);
  document.querySelector('#attack span')!.dispatchEvent(new MouseEvent('click',{bubbles:true}));
  expect(document.querySelector('#attack')!.classList.contains('slot-activated')).toBe(true);
  expect(document.querySelector('#potion')!.classList.contains('slot-activated')).toBe(false);
  cleanup();
 });
 it('releases the flash, including after repeated skill shortcuts',()=>{
  vi.useFakeTimers();const b=document.createElement('button');flashActionSlot(b);vi.advanceTimersByTime(300);flashActionSlot(b);vi.advanceTimersByTime(350);expect(b.classList.contains('slot-activated')).toBe(true);
  expect(b.classList.contains('slot-activated')).toBe(true);
  vi.advanceTimersByTime(650);expect(b.classList.contains('slot-activated')).toBe(false);
 });
});
