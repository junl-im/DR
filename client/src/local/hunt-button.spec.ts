import {afterEach,describe,expect,it,vi} from 'vitest';
import {bindHuntButton} from './hunt-button';
afterEach(()=>{vi.useRealTimers();document.body.innerHTML='';});

describe('auto hunt long press compatibility',()=>{
 it('long press opens settings once but never toggles hunt on release',()=>{
  vi.useFakeTimers();const btn=document.createElement('button');document.body.append(btn);
  btn.setPointerCapture=vi.fn();btn.releasePointerCapture=vi.fn();
  const toggle=vi.fn(),settings=vi.fn();bindHuntButton(btn,toggle,settings);
  const ev=(type:string)=>{const e=new MouseEvent(type,{button:0,clientX:12,clientY:12,bubbles:true,cancelable:true});
    Object.defineProperty(e,'isPrimary',{value:true});Object.defineProperty(e,'pointerId',{value:1});return e;};
  btn.dispatchEvent(ev('pointerdown'));vi.advanceTimersByTime(670);
  expect(settings).toHaveBeenCalledTimes(1);expect(toggle).not.toHaveBeenCalled();
  btn.dispatchEvent(ev('pointerup'));btn.dispatchEvent(new MouseEvent('click',{detail:1,bubbles:true,cancelable:true}));
  expect(toggle).not.toHaveBeenCalled();
  btn.dispatchEvent(ev('pointerdown'));vi.advanceTimersByTime(100);
  btn.dispatchEvent(ev('pointerup'));btn.dispatchEvent(new MouseEvent('click',{detail:1,bubbles:true,cancelable:true}));
  expect(toggle).toHaveBeenCalledTimes(1);
 });
 it('cancel and off-center moves never trigger the long-press action',()=>{
  vi.useFakeTimers();const btn=document.createElement('button');document.body.append(btn);btn.setPointerCapture=vi.fn();
  const toggle=vi.fn(),settings=vi.fn();bindHuntButton(btn,toggle,settings);
  const ev=(type:string,x:number)=>{const e=new MouseEvent(type,{button:0,clientX:x,clientY:8,bubbles:true,cancelable:true});
    Object.defineProperty(e,'isPrimary',{value:true});Object.defineProperty(e,'pointerId',{value:1});return e;};
  btn.dispatchEvent(ev('pointerdown',8));btn.dispatchEvent(ev('pointermove',30));
  vi.advanceTimersByTime(750);expect(settings).not.toHaveBeenCalled();
  btn.dispatchEvent(ev('pointerdown',8));btn.dispatchEvent(ev('pointercancel',8));
  vi.advanceTimersByTime(750);expect(settings).not.toHaveBeenCalled();expect(toggle).not.toHaveBeenCalled();
 });
});
