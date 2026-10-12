/** A render-only budget: player movement, camera picking and game state are unchanged. */
export const useMultisampleAntialiasing=(width:number,coarsePointer:boolean):boolean=>
  Number.isFinite(width)&&width>=800&&!coarsePointer;

/** Hysteresis prevents expensive shadow shader thrashing at the 38 FPS boundary.
 * Mobile never allocates the high-cost 2048px sun shadow map.
 */
export function createAdaptiveShadowGovernor(mobile:boolean){
  let enabled=!mobile,slow=0,fast=0;
  return{
    get enabled(){return enabled;},
    sample(fps:number,dpr:number):{enabled:boolean;changed:boolean}{
      if(mobile||!Number.isFinite(fps)||!Number.isFinite(dpr)||fps<=0||dpr<=0)
        return{enabled,changed:false};
      slow=fps<38||dpr<1.0?slow+1:0;
      fast=fps>53&&dpr>=1.1?fast+1:0;
      const prev=enabled;
      if(enabled&&slow>=2){enabled=false;slow=0;fast=0;}
      else if(!enabled&&fast>=4){enabled=true;slow=0;fast=0;}
      return{enabled,changed:prev!==enabled};
    }
  };
}
