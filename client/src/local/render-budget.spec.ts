import {describe,it,expect} from 'vitest';
import {useMultisampleAntialiasing,createAdaptiveShadowGovernor} from './render-budget';

describe('low-power rendering policy',()=>{
  it('turns off expensive MSAA on touch screens and small viewports',()=>{
    expect(useMultisampleAntialiasing(390,true)).toBe(false);
    expect(useMultisampleAntialiasing(800,true)).toBe(false);
    expect(useMultisampleAntialiasing(700,false)).toBe(false);
    expect(useMultisampleAntialiasing(1440,false)).toBe(true);
    expect(useMultisampleAntialiasing(Number.NaN,false)).toBe(false);
  });
  it('never enables scene shadows on mobile regardless of reported frames',()=>{
    const mobile=createAdaptiveShadowGovernor(true);
    expect(mobile.enabled).toBe(false);
    for(let i=0;i<10;i++)expect(mobile.sample(120,1.5)).toEqual({enabled:false,changed:false});
  });
  it('sheds desktop shadows after sustained low frame rate, recovers slowly',()=>{
    const q=createAdaptiveShadowGovernor(false);
    expect(q.enabled).toBe(true);
    expect(q.sample(35,1.3).changed).toBe(false);
    expect(q.sample(35,1.3)).toEqual({enabled:false,changed:true});
    for(let i=0;i<3;i++)expect(q.sample(60,1.2).changed).toBe(false);
    expect(q.sample(60,1.2)).toEqual({enabled:true,changed:true});
  });
  it('does not oscillate on unstable FPS or NaN measurements',()=>{
    const q=createAdaptiveShadowGovernor(false);
    for(let i=0;i<8;i++){
      q.sample(35,1.3);q.sample(48,1.3);
    }
    expect(q.enabled).toBe(true);
    expect(q.sample(Number.NaN,1.3).changed).toBe(false);
    expect(q.sample(30,0).changed).toBe(false);
    q.sample(60,.9);q.sample(60,.9);
    expect(q.enabled).toBe(true);
  });
});
