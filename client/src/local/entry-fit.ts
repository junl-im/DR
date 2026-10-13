/** Keep every title action in the visual viewport; adapt again when the keyboard changes it. */
export function fitEntryScreen(root:HTMLElement){
 const entry=root.querySelector<HTMLElement>('.title-entry');if(!entry)return;
 const frame=document.createElement('div');frame.className='entry-fit';
 for(const child of [...entry.children])if(!child.matches('.entry-world,.entry-vignette'))frame.append(child);
 entry.append(frame);
 const fit=()=>{const view=window.visualViewport;entry.style.height=(view?.height??innerHeight)+'px';entry.style.top=(view?.offsetTop??0)+'px';const scale=Math.min(1,Math.max(1,entry.clientHeight-12)/Math.max(1,frame.offsetHeight));frame.style.setProperty('--entry-scale',String(scale));};
 const observer=new ResizeObserver(fit);observer.observe(frame);window.addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);window.visualViewport?.addEventListener('scroll',fit);fit();
 return ()=>{observer.disconnect();window.removeEventListener('resize',fit);window.visualViewport?.removeEventListener('resize',fit);window.visualViewport?.removeEventListener('scroll',fit);};
}
