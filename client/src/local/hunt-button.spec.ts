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

describe('delayed hold dispatch',()=>{
 it('recognizes the elapsed press on release even before the timer callback can run',()=>{
  vi.useFakeTimers();const button=document.createElement('button');document.body.append(button);button.setPointerCapture=vi.fn();
  const toggle=vi.fn(),settings=vi.fn();bindHuntButton(button,toggle,settings);
  const pointer=(type:string,stamp:number)=>{const e=new MouseEvent(type,{button:0,clientX:8,clientY:8,bubbles:true,cancelable:true});for(const [key,value] of Object.entries({pointerId:1,isPrimary:true,timeStamp:stamp}))Object.defineProperty(e,key,{value});return e;};
  button.dispatchEvent(pointer('pointerdown',100));
  // The physical gesture elapsed, but the main-thread timer has not executed.
  button.dispatchEvent(pointer('pointerup',900));
  expect(settings).toHaveBeenCalledTimes(1);
  const click=new MouseEvent('click',{detail:0,bubbles:true,cancelable:true});Object.defineProperty(click,'pointerType',{value:'touch'});button.dispatchEvent(click);
  vi.runOnlyPendingTimers();expect(settings).toHaveBeenCalledTimes(1);expect(toggle).not.toHaveBeenCalled();
  button.dispatchEvent(new MouseEvent('click',{detail:0,bubbles:true}));expect(toggle).toHaveBeenCalledTimes(1);
 });
 it('never turns a cancelled or moved press into an overdue hold',()=>{
  vi.useFakeTimers();const button=document.createElement('button');button.setPointerCapture=vi.fn();const settings=vi.fn();bindHuntButton(button,vi.fn(),settings);
  const pointer=(type:string,x:number,stamp:number)=>{const e=new MouseEvent(type,{button:0,clientX:x,clientY:8,bubbles:true});for(const [key,value] of Object.entries({pointerId:1,isPrimary:true,timeStamp:stamp}))Object.defineProperty(e,key,{value});return e;};
  button.dispatchEvent(pointer('pointerdown',8,100));button.dispatchEvent(pointer('pointercancel',8,200));button.dispatchEvent(pointer('pointerup',8,1000));
  button.dispatchEvent(pointer('pointerdown',8,1100));button.dispatchEvent(pointer('pointermove',25,1200));button.dispatchEvent(pointer('pointerup',8,1900));vi.runOnlyPendingTimers();expect(settings).not.toHaveBeenCalled();
 });
});
