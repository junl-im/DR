import {afterEach,describe,expect,it} from 'vitest';
import {installGameInputGuard} from './game-input-guard';
let dispose:(()=>void)|undefined;
afterEach(()=>{dispose?.();dispose=undefined;document.body.innerHTML='';});
describe('game input browser-action guard',()=>{
 it('disables right mouse context menus and native drag on game and title screens',()=>{
   document.body.innerHTML='<div id="game-zone">Dungeon</div><img id="art" src="about:blank">';
   dispose=installGameInputGuard(document);
   for(const type of ['contextmenu','dragstart','dragover','drop']){
     const event=new MouseEvent(type,{button:2,bubbles:true,cancelable:true});
     document.getElementById('game-zone')!.dispatchEvent(event);
     expect(event.defaultPrevented).toBe(true);
   }
   const img=new Event('dragstart',{bubbles:true,cancelable:true});
   document.getElementById('art')!.dispatchEvent(img);
   expect(img.defaultPrevented).toBe(true);
   const right=new MouseEvent('auxclick',{button:2,bubbles:true,cancelable:true});
   document.getElementById('game-zone')!.dispatchEvent(right);
   expect(right.defaultPrevented).toBe(true);
 });
 it('blocks selection of HUD text but preserves typing selections in chat and save-name fields',()=>{
   document.body.innerHTML='<span id="label">Player</span><input id="chat"><textarea id="note"></textarea>';
   dispose=installGameInputGuard(document);
   for(const [selector,blocked] of [['#label',true],['#chat',false],['#note',false]] as const){
     const ev=new Event('selectstart',{bubbles:true,cancelable:true});
     document.querySelector(selector)!.dispatchEvent(ev);
     expect(ev.defaultPrevented).toBe(blocked);
   }
   const left=new MouseEvent('pointerdown',{button:0,bubbles:true,cancelable:true});
   document.getElementById('chat')!.dispatchEvent(left);
   expect(left.defaultPrevented).toBe(false);
 });
 it('prevents game scripts from receiving secondary pointerdown and auxclick but preserves primary input',()=>{
   document.body.innerHTML='<canvas id="game"></canvas>';
   const canvas=document.getElementById('game')!;
   const seen:string[]=[];
   canvas.addEventListener('pointerdown',()=>seen.push('pointerdown'));
   canvas.addEventListener('auxclick',()=>seen.push('auxclick'));
   canvas.addEventListener('contextmenu',()=>seen.push('contextmenu'));
   dispose=installGameInputGuard(document);
   for(const button of [1,2]){
     const down=new MouseEvent('pointerdown',{button,bubbles:true,cancelable:true});
     canvas.dispatchEvent(down);
     expect(down.defaultPrevented).toBe(true);
     const aux=new MouseEvent('auxclick',{button,bubbles:true,cancelable:true});
     canvas.dispatchEvent(aux);
     expect(aux.defaultPrevented).toBe(true);
   }
   const menu=new MouseEvent('contextmenu',{button:2,bubbles:true,cancelable:true});
   canvas.dispatchEvent(menu);
   expect(menu.defaultPrevented).toBe(true);
   expect(seen).toEqual([]);
   const left=new MouseEvent('pointerdown',{button:0,bubbles:true,cancelable:true});
   canvas.dispatchEvent(left);
   expect(left.defaultPrevented).toBe(false);
   expect(seen).toEqual(['pointerdown']);
 });
 it('stops native file/image dragging before application listeners can change game state',()=>{
   document.body.innerHTML='<img id="portrait" src="about:blank">';
   const element=document.getElementById('portrait')!;
   let reached=false;
   element.addEventListener('dragstart',()=>{reached=true});
   dispose=installGameInputGuard(document);
   const drag=new Event('dragstart',{bubbles:true,cancelable:true});
   element.dispatchEvent(drag);
   expect(reached).toBe(false);
   expect(drag.defaultPrevented).toBe(true);
 });
 it('blocks keyboard menu invocation and detaches cleanly',()=>{
   dispose=installGameInputGuard(document);
   const contextKey=new KeyboardEvent('keydown',{key:'ContextMenu',bubbles:true,cancelable:true});
   document.dispatchEvent(contextKey);
   expect(contextKey.defaultPrevented).toBe(true);
   dispose();dispose=undefined;
   const ev=new MouseEvent('contextmenu',{button:2,bubbles:true,cancelable:true});
   document.dispatchEvent(ev);expect(ev.defaultPrevented).toBe(false);
 });
});
