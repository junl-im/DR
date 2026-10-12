/** Small adaptive resolution governor. CSS viewport and gameplay timestep are untouched.
 * Uses multi-second windows with hysteresis to avoid oscillation and GPU thrash.
 */
export interface QualityDecision {dpr:number;changed:boolean;fps:number}
export function createResolutionGovernor(deviceRatio:number,mobile:boolean) {
  const ceiling=Math.max(.7,Math.min(deviceRatio,mobile?1.1:1.5));
  const floor=Math.min(ceiling,mobile?.72:.9);
  let dpr=ceiling,elapsed=0,frames=0,slow=0,fast=0,fps=60;
  return {
    get dpr(){return dpr;},
    get minDpr(){return floor;},
    get maxDpr(){return ceiling;},
    sample(deltaSeconds:number):QualityDecision {
      if(!Number.isFinite(deltaSeconds)||deltaSeconds<=0||deltaSeconds>.5)return{dpr,changed:false,fps};
      elapsed+=deltaSeconds;frames++;
      if(elapsed<2.5)return{dpr,changed:false,fps};
      fps=frames/elapsed;
      elapsed=0;frames=0;
      slow=fps<38?slow+1:0;fast=fps>57?fast+1:0;
      const before=dpr;
      if(slow>=2){dpr=Math.max(floor,Math.round((dpr-.15)*100)/100);slow=0;fast=0;}
      else if(fast>=4){dpr=Math.min(ceiling,Math.round((dpr+.1)*100)/100);fast=0;slow=0;}
      return{dpr,changed:Math.abs(before-dpr)>.001,fps};
    },
  };
}
