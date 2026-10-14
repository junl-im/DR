/** Physical keys work with Korean/English layouts; browser shortcuts stay native. */
export function isTypingTarget(target:EventTarget|null):boolean {
 return target instanceof Element && !!target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]');
}
export function gameKey(event:KeyboardEvent):string {
 if(event.ctrlKey||event.metaKey||event.altKey||event.isComposing)return '';
 const code=event.code;
 if(code==='Space')return ' ';
 if(/^Key[A-Z]$/.test(code))return code.slice(3).toLowerCase();
 if(/^Digit[0-9]$/.test(code))return code.slice(5);
 return event.key.toLowerCase();
}
const directions:Record<string,[number,number]>={w:[0,-1],arrowup:[0,-1],s:[0,1],arrowdown:[0,1],a:[-1,0],arrowleft:[-1,0],d:[1,0],arrowright:[1,0]};
/** Screen axes for the fixed +X/+Z camera. Unit length prevents diagonal speed boosts. */
export function movementDirection(keys:Iterable<string>):{x:number;z:number}|null {
 let horizontal=0,vertical=0;
 const axes=new Map([...keys].filter(k=>directions[k]).map(k=>[directions[k].join(','),directions[k]])).values();
 for(const [x,y] of axes){horizontal+=x;vertical+=y;}
 const length=Math.hypot(horizontal,vertical);if(!length)return null;
 return {x:(horizontal+vertical)/length/Math.SQRT2,z:(vertical-horizontal)/length/Math.SQRT2};
}
export function bindPcMovement(options:{window:Window;blocked:()=>boolean;start:()=>void;stop:()=>void;move:(direction:{x:number;z:number})=>void}) {
 const held=new Set<string>();let elapsed=0;
 const cancel=()=>{if(held.size){held.clear();options.stop();}elapsed=0;};
 const down=(event:KeyboardEvent)=>{
  const key=gameKey(event);if(!directions[key])return;
  if(isTypingTarget(event.target)||options.blocked()){cancel();return;}
  event.preventDefault();if(event.repeat)return;
  if(!held.size)options.start();held.add(key);if(!movementDirection(held))options.stop();elapsed=.15;
 };
 const up=(event:KeyboardEvent)=>{const key=event.code.startsWith('Key')?event.code.slice(3).toLowerCase():event.key.toLowerCase();if(!held.delete(key))return;elapsed=.15;if(!movementDirection(held))options.stop();};
 const focus=(event:FocusEvent)=>{if(isTypingTarget(event.target))cancel();};
 const visibility=()=>{if(options.window.document.hidden)cancel();};
 options.window.addEventListener('keydown',down);options.window.addEventListener('keyup',up);
 options.window.addEventListener('blur',cancel);options.window.document.addEventListener('visibilitychange',visibility);options.window.document.addEventListener('focusin',focus);
 return {get active(){return held.size>0;},cancel,tick(dt:number){
  if(options.blocked()||isTypingTarget(options.window.document.activeElement)){cancel();return;}
  const direction=movementDirection(held);if(!direction)return;
  elapsed+=dt;if(elapsed>=.15){elapsed=0;options.move(direction);}
 },dispose(){cancel();options.window.removeEventListener('keydown',down);options.window.removeEventListener('keyup',up);options.window.removeEventListener('blur',cancel);options.window.document.removeEventListener('visibilitychange',visibility);options.window.document.removeEventListener('focusin',focus);}};
}
