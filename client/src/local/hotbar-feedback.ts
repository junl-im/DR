/** A click animation proves a hotbar action was acknowledged by the UI,
 * even when a skill is on cooldown. Never changes combat damage or timing.
 */
export function flashActionSlot(button:HTMLElement | null):void {
 if(!button)return;
 button.classList.remove('slot-activated');
 // Restart short animation even after successive rapid clicks.
 void button.offsetWidth;
 button.classList.add('slot-activated');
 window.setTimeout(()=>button.classList.remove('slot-activated'),340);
}
export function bindHotbarClickFeedback(host:HTMLElement):()=>void {
 const onClick=(event:MouseEvent)=>{
   if(!(event.target instanceof Element))return;
   const button=event.target.closest<HTMLElement>('.actions button');
   if(button&&host.contains(button))flashActionSlot(button);
 };
 host.addEventListener('click',onClick);
 return()=>host.removeEventListener('click',onClick);
}
