/** Suppress browser-specific mouse menus, text/image drag and secondary clicks
 * inside the game. Native typing/selection in genuine text fields is retained.
 * No gameplay input or right-click menu is emulated by this guard.
 */
export function installGameInputGuard(doc:Document=document):()=>void{
  const editable=(target:EventTarget|null)=>target instanceof Element &&
    !!target.closest('input,textarea,[contenteditable="true"],[role="textbox"]');
  const context=(event:Event)=>event.preventDefault();
  const drag=(event:Event)=>event.preventDefault();
  const select=(event:Event)=>{if(!editable(event.target))event.preventDefault();};
  const secondary=(event:Event)=>{
    if(event instanceof MouseEvent && event.button!==0)event.preventDefault();
  };
  const keyboard=(event:KeyboardEvent)=>{
    if(event.key==='ContextMenu'||(event.shiftKey&&event.key==='F10'))event.preventDefault();
  };
  doc.addEventListener('contextmenu',context,{capture:true});
  doc.addEventListener('dragstart',drag,{capture:true});
  doc.addEventListener('dragover',drag,{capture:true});
  doc.addEventListener('drop',drag,{capture:true});
  doc.addEventListener('selectstart',select,{capture:true});
  doc.addEventListener('auxclick',secondary,{capture:true});
  doc.addEventListener('pointerdown',secondary,{capture:true});
  doc.addEventListener('keydown',keyboard,{capture:true});
  return()=>{
    doc.removeEventListener('contextmenu',context,true);
    doc.removeEventListener('dragstart',drag,true);
    doc.removeEventListener('dragover',drag,true);
    doc.removeEventListener('drop',drag,true);
    doc.removeEventListener('selectstart',select,true);
    doc.removeEventListener('auxclick',secondary,true);
    doc.removeEventListener('pointerdown',secondary,true);
    doc.removeEventListener('keydown',keyboard,true);
  };
}
