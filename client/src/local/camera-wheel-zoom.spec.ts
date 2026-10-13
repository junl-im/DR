import {describe,it,expect} from 'vitest';
import {clampCameraZoom,nextWheelZoom,CAMERA_ZOOM_MAX,CAMERA_ZOOM_MIN} from './camera-wheel-zoom';
describe('bounded mouse wheel zoom',()=>{
 it('zoom out with wheel down and in with wheel up',()=>{
   expect(nextWheelZoom(1,120)).toBeGreaterThan(1);
   expect(nextWheelZoom(1,-120)).toBeLessThan(1);
 });
 it('clamps repeated wheel scroll, accepts no NaN',()=>{
   let far=1,close=1;
   for(let i=0;i<300;i++){far=nextWheelZoom(far,120);close=nextWheelZoom(close,-120);}
   expect(far).toBe(CAMERA_ZOOM_MAX);expect(close).toBe(CAMERA_ZOOM_MIN);
   expect(clampCameraZoom(NaN)).toBe(1);
   expect(nextWheelZoom(1,0)).toBe(1);
 });
});
