import { it, expect } from 'vitest';
import { scrollbarMetrics } from './game-scrollbars';
it('keeps short content and oversized scroll input inside the game rail', () => {
  expect(scrollbarMetrics(100, 50, 80, 100)).toEqual({
    max: 0,
    size: 80,
    travel: 0,
    offset: 0,
  });
  const bottom = scrollbarMetrics(100, 1000, 80, 5000);
  expect(bottom.size).toBe(28);
  expect(bottom.offset).toBe(bottom.travel);
  expect(scrollbarMetrics(100, 1000, 80, -20).offset).toBe(0);
});


import {createGameScrollbars} from './game-scrollbars';
it('hides offscreen nested page controls and clips partially visible page controls below a sticky window heading',()=>{
 const root=document.createElement('div'),panel=document.createElement('section'),heading=document.createElement('div'),bag=document.createElement('div');panel.className='panel';bag.className='bag-grid';heading.className='inventory-heading';panel.style.overflowY='auto';panel.style.overflowX='hidden';bag.style.overflowY='auto';heading.style.position='sticky';panel.append(heading,bag);root.append(panel);document.body.append(root);
 const box=(el:HTMLElement,x:number,y:number,width:number,height:number)=>{el.getBoundingClientRect=()=>new DOMRect(x,y,width,height);};
 box(root,0,0,500,500);box(panel,0,100,300,200);box(heading,0,100,300,40);box(bag,0,20,200,100);
 for(const [el,height,content,width] of [[panel,200,1000,300],[bag,100,400,200]] as const){Object.defineProperties(el,{clientHeight:{value:height,configurable:true},scrollHeight:{value:content,configurable:true},clientWidth:{value:width,configurable:true}});}
 const rails=createGameScrollbars(root);rails.update();const rail=root.querySelector<HTMLDivElement>('[data-page-for="'+bag.id+'"]')!;expect(rail.hidden).toBe(true);
 box(bag,0,120,200,120);rails.update();expect(rail.hidden).toBe(false);expect(Number.parseFloat(rail.style.top)).toBeGreaterThanOrEqual(140);expect(rail.style.clipPath).toBe('inset(0px 0px 0px 0px)');
 box(bag,0,150,200,100);rails.update();expect(rail.style.clipPath).toBe('inset(0px 0px 0px 0px)');rails.dispose();root.remove();
});
