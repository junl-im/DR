/** Small renderer-independent projection for readable overhead HUD labels. */
export interface NameScreenPoint{x:number;y:number;z:number}
export interface NameScreenBounds{left:number;top:number;width:number;height:number}
export function nameplateScreenPoint(
  ndc:NameScreenPoint,rect:NameScreenBounds,margin=.96
):{x:number;y:number}|null{
  if([ndc.x,ndc.y,ndc.z,rect.left,rect.top,rect.width,rect.height].some(n=>!Number.isFinite(n)))return null;
  if(rect.width<=0||rect.height<=0||ndc.z< -1||ndc.z>1||
     Math.abs(ndc.x)>=margin||Math.abs(ndc.y)>=margin)return null;
  return{
    x:Math.round(rect.left+(ndc.x+1)*rect.width/2),
    y:Math.round(rect.top+(1-ndc.y)*rect.height/2),
  };
}
