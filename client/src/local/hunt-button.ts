/** Tap toggles; a held or cancelled pointer must never also toggle on release. */
export function bindHuntButton(button:HTMLButtonElement,toggle:()=>void,settings:()=>void){
  let timer:ReturnType<typeof setTimeout>|undefined,start:{x:number;y:number}|undefined,suppress=false;
  const clear=()=>{if(timer!==undefined)clearTimeout(timer);timer=undefined;};
  button.addEventListener('pointerdown',e=>{
    if(!e.isPrimary||e.button!==0)return;
    clear();suppress=false;start={x:e.clientX,y:e.clientY};button.setPointerCapture(e.pointerId);
    timer=setTimeout(()=>{timer=undefined;suppress=true;settings();},650);
  });
  button.addEventListener('pointermove',e=>{if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>12){clear();start=undefined;suppress=true;}});
  button.addEventListener('pointerup',()=>{clear();start=undefined;});
  button.addEventListener('pointercancel',()=>{clear();start=undefined;suppress=true;});
  button.addEventListener('lostpointercapture',()=>{clear();start=undefined;});
  button.addEventListener('click',e=>{if(suppress&&e.detail!==0){e.preventDefault();return;}toggle();});
  button.addEventListener('contextmenu',e=>{e.preventDefault();clear();suppress=true;settings();});
  button.addEventListener('keydown',e=>{if(e.key==='ContextMenu'||(e.shiftKey&&e.key==='F10')){e.preventDefault();settings();}});
  window.addEventListener('blur',()=>{clear();start=undefined;suppress=true;});
}
