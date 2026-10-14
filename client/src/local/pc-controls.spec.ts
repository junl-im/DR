import {afterEach,describe,expect,it,vi} from 'vitest';
import {bindPcMovement,gameKey,movementDirection,isTypingTarget} from './pc-controls';
describe('PC physical controls',()=>{
 const disposers:(()=>void)[]=[];
 afterEach(()=>{disposers.splice(0).forEach(fn=>fn());document.body.innerHTML='';});
 function bind(){const callbacks={start:vi.fn(),stop:vi.fn(),move:vi.fn(),blocked:vi.fn(()=>false)};const control=bindPcMovement({window,...callbacks});disposers.push(control.dispose);return {...callbacks,control};}
 function key(type:string,code:string,target:EventTarget=window,extra:KeyboardEventInit={}){const event=new KeyboardEvent(type,{code,key:code==='KeyW'?'ㅈ':code,bubbles:true,cancelable:true,...extra});target.dispatchEvent(event);return event;}
 it('maps screen up/right and normalizes diagonals and duplicate arrow bindings',()=>{
  expect(movementDirection(['w'])).toEqual({x:-1/Math.SQRT2,z:-1/Math.SQRT2});
  expect(movementDirection(['d'])!.x).toBeGreaterThan(0);expect(movementDirection(['d'])!.z).toBeLessThan(0);
  expect(movementDirection(['w','s'])).toBeNull();
  const diagonal=movementDirection(['w','d'])!;expect(Math.hypot(diagonal.x,diagonal.z)).toBeCloseTo(1);
  expect(movementDirection(['w','arrowup','d'])).toEqual(diagonal);
 });
 it('uses physical keys with Korean layout and leaves modifiers/composition native',()=>{
  expect(gameKey(new KeyboardEvent('keydown',{code:'KeyW',key:'ㅈ'}))).toBe('w');
  expect(gameKey(new KeyboardEvent('keydown',{code:'Space',key:' '}))).toBe(' ');
  for(const extra of [{ctrlKey:true},{metaKey:true},{altKey:true},{isComposing:true}])expect(gameKey(new KeyboardEvent('keydown',{code:'KeyW',...extra}))).toBe('');
 });
 it('moves on ticks, does not restart on repeats, stops immediately on last release',()=>{
  const b=bind();expect(key('keydown','KeyW').defaultPrevented).toBe(true);b.control.tick(.05);
  expect(b.control.active).toBe(true);expect(b.start).toHaveBeenCalledTimes(1);expect(b.move).toHaveBeenCalledTimes(1);
  key('keydown','KeyW',window,{repeat:true});b.control.tick(.05);expect(b.move).toHaveBeenCalledTimes(1);
  key('keyup','KeyW');expect(b.control.active).toBe(false);expect(b.stop).toHaveBeenCalledTimes(1);b.control.tick(1);expect(b.move).toHaveBeenCalledTimes(1);
 });
 it('releases motion on focus, blur, window opening and pause without sticky keys',()=>{
  const b=bind();key('keydown','KeyW');b.control.tick(.05);window.dispatchEvent(new Event('blur'));expect(b.stop).toHaveBeenCalledTimes(1);
  key('keydown','KeyD');b.blocked.mockReturnValue(true);b.control.tick(.05);expect(b.stop).toHaveBeenCalledTimes(2);
  b.blocked.mockReturnValue(false);b.control.tick(1);expect(b.move).toHaveBeenCalledTimes(1);
  key('keydown','KeyW');const input=document.createElement('input');document.body.append(input);input.focus();expect(b.stop).toHaveBeenCalledTimes(3);
  key('keydown','KeyW',input);b.control.tick(1);expect(b.move).toHaveBeenCalledTimes(1);
 });
 it('respects editable descendants, dropdowns and browser shortcuts',()=>{
  const b=bind();document.body.innerHTML='<div contenteditable="true"><span id="typing">abc</span></div><select></select>';
  for(const target of [document.querySelector('#typing')!,document.querySelector('select')!]){expect(isTypingTarget(target)).toBe(true);expect(key('keydown','KeyW',target).defaultPrevented).toBe(false);}
  key('keydown','KeyW',window,{ctrlKey:true});b.control.tick(1);expect(b.start).not.toHaveBeenCalled();expect(b.move).not.toHaveBeenCalled();
 });
});
