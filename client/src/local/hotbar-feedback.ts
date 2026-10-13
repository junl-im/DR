/** A click animation proves a hotbar action was acknowledged by the UI,
 * even when a skill is on cooldown. Never changes combat damage or timing.
 */
const flashTimers=new WeakMap<HTMLElement,{timer?:number}>();
export function flashActionSlot(button:HTMLElement | null):void {
 if(!button)return;
 button.classList.remove('slot-activated');
 // Restart short animation even after successive rapid clicks.
 void button.offsetWidth;
 button.classList.add('slot-activated');
 const previous=flashTimers.get(button);if(previous?.timer!==undefined)window.clearTimeout(previous.timer);
 const token:{timer?:number}={};flashTimers.set(button,token);
 const arm=()=>{if(flashTimers.get(button)!==token)return;token.timer=window.setTimeout(()=>{if(flashTimers.get(button)!==token)return;button.classList.remove('slot-activated');flashTimers.delete(button);},650);};
 // Timers can run before the first slow WebGL frame. Keep the acknowledgement
 // until a real paint opportunity, then hold it for 650ms. Stale frames from
 // previous rapid taps cannot shorten the latest tap.
 if(window.requestAnimationFrame)window.requestAnimationFrame(()=>window.requestAnimationFrame(arm));
 else arm();
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
