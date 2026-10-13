/** Keep every title action in the visual viewport, including mobile browser
 * chrome / virtual-keyboard resizes and late font reflow. The frame is scaled
 * visually; its unscaled scroll extents are the trustworthy fit dimensions.
 */
export function entryScaleForViewport(
  viewportWidth:number, viewportHeight:number,
  contentWidth:number, contentHeight:number
):number {
  const finite=(value:number)=>Number.isFinite(value)&&value>0?value:1;
  const maxWidth=Math.max(1,finite(viewportWidth)-20);
  const maxHeight=Math.max(1,finite(viewportHeight)-24);
  return Math.max(.01,Math.min(
    1,
    maxWidth/finite(contentWidth),
    maxHeight/finite(contentHeight)
  ));
}

export function fitEntryScreen(root:HTMLElement):()=>void {
  const entry=root.querySelector<HTMLElement>('.title-entry');
  if(!entry)return ()=>undefined;
  const frame=document.createElement('div');
  frame.className='entry-fit';
  for(const child of [...entry.children]){
    if(!child.matches('.entry-world,.entry-vignette'))frame.append(child);
  }
  entry.append(frame);

  let disposed=false;
  const fit=()=>{
    if(disposed)return;
    const view=window.visualViewport;
    const height=view?.height??window.innerHeight;
    entry.style.height=height+'px';
    entry.style.top=(view?.offsetTop??0)+'px';

    // offsetHeight alone misses overflow caused by late-loading fonts,
    // long character names, saved-game text and children with margins.
    const contentHeight=Math.max(frame.offsetHeight,frame.scrollHeight);
    const contentWidth=Math.max(frame.offsetWidth,frame.scrollWidth);
    const scale=entryScaleForViewport(entry.clientWidth,entry.clientHeight,contentWidth,contentHeight);
    frame.style.setProperty('--entry-scale',String(scale));
  };

  const observer=new ResizeObserver(fit);
  observer.observe(frame);
  observer.observe(entry);
  window.addEventListener('resize',fit);
  window.visualViewport?.addEventListener('resize',fit);
  window.visualViewport?.addEventListener('scroll',fit);
  document.fonts?.addEventListener('loadingdone',fit);
  fit();
  // Async font/paint settling can change layout after the initial mount.
  void document.fonts?.ready.then(()=>fit());
  return ()=>{
    disposed=true;
    observer.disconnect();
    window.removeEventListener('resize',fit);
    window.visualViewport?.removeEventListener('resize',fit);
    window.visualViewport?.removeEventListener('scroll',fit);
    document.fonts?.removeEventListener('loadingdone',fit);
  };
}
