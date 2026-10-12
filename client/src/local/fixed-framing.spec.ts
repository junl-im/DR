import {describe,expect,it} from 'vitest';
import {FIXED_FRAME_DESKTOP,FIXED_FRAME_MOBILE,fixedFrameForViewport,validFixedFrame} from './fixed-framing';
describe('safe fixed-angle combat readability framing',()=>{
  it('enlarges models by reducing camera distance without rescaling entities',()=>{
    expect(FIXED_FRAME_DESKTOP.offset).toEqual({x:21,y:28,z:21});
    expect(FIXED_FRAME_MOBILE.offset).toEqual({x:23,y:30,z:23});
    const legacy=Math.hypot(26,34,26);
    expect(Math.hypot(...Object.values(FIXED_FRAME_DESKTOP.offset))).toBeLessThan(legacy*.9);
    expect(Math.hypot(...Object.values(FIXED_FRAME_MOBILE.offset))).toBeLessThan(legacy);
    expect(FIXED_FRAME_DESKTOP.fov).toBe(38);
  });
  it('gives small mobile viewports more world context than desktop',()=>{
    expect(fixedFrameForViewport(390)).toBe(FIXED_FRAME_MOBILE);
    expect(fixedFrameForViewport(700)).toBe(FIXED_FRAME_MOBILE);
    expect(fixedFrameForViewport(701)).toBe(FIXED_FRAME_DESKTOP);
    expect(fixedFrameForViewport(1440)).toBe(FIXED_FRAME_DESKTOP);
    expect(validFixedFrame(FIXED_FRAME_DESKTOP)).toBe(true);
    expect(validFixedFrame(FIXED_FRAME_MOBILE)).toBe(true);
    expect(validFixedFrame({offset:{x:0,y:-1,z:0},fov:120})).toBe(false);
  });
});
