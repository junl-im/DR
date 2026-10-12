/** Fixed-diagonal gameplay framing. Small changes to camera distance change
 * apparent sizes of EVERY model without changing collider, world position,
 * equipment bone or skill range. Mobile keeps a slightly wider view to
 * preserve nearby enemy visibility below the on-screen action dock.
 */
export interface FixedFrame {offset:{x:number;y:number;z:number};fov:number}
export const FIXED_FRAME_DESKTOP:FixedFrame={offset:{x:21,y:28,z:21},fov:38};
export const FIXED_FRAME_MOBILE:FixedFrame={offset:{x:23,y:30,z:23},fov:38};
export function fixedFrameForViewport(width:number):FixedFrame {
  return width<=700?FIXED_FRAME_MOBILE:FIXED_FRAME_DESKTOP;
}
export function validFixedFrame(frame:FixedFrame):boolean {
  const v=frame.offset;
  return [v.x,v.y,v.z,frame.fov].every(Number.isFinite) &&
    v.x>0 && v.z>0 && v.x===v.z &&
    v.y>=v.x && v.y<2*v.x && frame.fov>=30 && frame.fov<=55;
}
