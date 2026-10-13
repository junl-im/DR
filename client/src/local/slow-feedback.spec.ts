import {it,expect,vi} from 'vitest';
import {flashActionSlot} from './hotbar-feedback';
it('keeps acknowledgement when a slow WebGL frame arrives after the wall-clock timeout',()=>{
 vi.useFakeTimers();const original=Object.getOwnPropertyDescriptor(window,'requestAnimationFrame'),frames:FrameRequestCallback[]=[];
 Object.defineProperty(window,'requestAnimationFrame',{configurable:true,value:(fn:FrameRequestCallback)=>{frames.push(fn);return frames.length;}});
 try{
  const button=document.createElement('button');flashActionSlot(button);vi.advanceTimersByTime(5000);
  expect(button.classList.contains('slot-activated')).toBe(true);
  frames.shift()!(5000);frames.shift()!(5100);
  vi.advanceTimersByTime(649);expect(button.classList.contains('slot-activated')).toBe(true);
  vi.advanceTimersByTime(1);expect(button.classList.contains('slot-activated')).toBe(false);
 }finally{if(original)Object.defineProperty(window,'requestAnimationFrame',original);else Reflect.deleteProperty(window,'requestAnimationFrame');vi.useRealTimers();}
});
