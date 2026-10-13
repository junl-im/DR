const HOLD_MS=650;
/** Input event time survives a delayed render/timer queue. Release must not
 * downgrade an already-held gesture to a tap just because its timer ran late. */
export function bindHuntButton(button:HTMLButtonElement,toggle:()=>void,settings:()=>void){
 let timer:ReturnType<typeof setTimeout>|undefined;
 let press:{id:number;x:number;y:number;stamp:number;opened:boolean}|undefined;
 let suppress=false;
 const clear=()=>{if(timer!==undefined)clearTimeout(timer);timer=undefined;};
 const hold=()=>{if(!press||press.opened)return;press.opened=true;suppress=true;settings();};
 const cancel=()=>{clear();press=undefined;suppress=true;};
 button.addEventListener('pointerdown',event=>{
  if(!event.isPrimary||event.button!==0)return;
  clear();suppress=false;press={id:event.pointerId,x:event.clientX,y:event.clientY,stamp:event.timeStamp,opened:false};
  button.setPointerCapture(event.pointerId);timer=setTimeout(()=>{timer=undefined;hold();},HOLD_MS);
 });
 button.addEventListener('pointermove',event=>{if(press&&event.pointerId===press.id&&Math.hypot(event.clientX-press.x,event.clientY-press.y)>12)cancel();});
 button.addEventListener('pointerup',event=>{
  if(!press||event.pointerId!==press.id)return;
  if(Math.hypot(event.clientX-press.x,event.clientY-press.y)>12){cancel();return;}
  if(event.timeStamp-press.stamp>=HOLD_MS)hold();
  clear();press=undefined;
 });
 button.addEventListener('pointercancel',cancel);
 button.addEventListener('lostpointercapture',()=>{if(press)cancel();});
 button.addEventListener('click',event=>{
  const pointerClick='pointerType' in event&&!!event.pointerType;
  if(suppress&&(event.detail!==0||pointerClick)){event.preventDefault();return;}
  toggle();
 });
 // Secondary mouse/browser-menu gestures stay disabled by the game input guard.
 button.addEventListener('contextmenu',event=>{event.preventDefault();cancel();});
 button.addEventListener('keydown',event=>{if(event.key==='ContextMenu'||(event.shiftKey&&event.key==='F10'))event.preventDefault();});
 window.addEventListener('blur',cancel);
}
