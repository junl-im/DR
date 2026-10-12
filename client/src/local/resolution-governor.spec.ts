import {describe,it,expect} from 'vitest';
import {createResolutionGovernor} from './resolution-governor';
describe('adaptive DPR for mobile and desktop',()=>{
  const window=(governor:ReturnType<typeof createResolutionGovernor>,fps:number,seconds=2.6)=>{
    let outcome={dpr:governor.dpr,changed:false,fps};
    const dt=1/fps;
    for(let t=0;t<seconds;t+=dt)outcome=governor.sample(dt);
    return outcome;
  };
  it('caps default mobile DPR and degrades only after sustained low FPS',()=>{
    const q=createResolutionGovernor(3,true);
    expect(q.maxDpr).toBe(1.1);
    expect(q.minDpr).toBe(.72);
    window(q,27);
    expect(q.dpr).toBe(1.1);
    window(q,27);
    expect(q.dpr).toBeLessThan(1.1);
    for(let i=0;i<14;i++)window(q,22);
    expect(q.dpr).toBeGreaterThanOrEqual(.72);
  });
  it('stays stable under mixed workloads and recovers slowly',()=>{
    const q=createResolutionGovernor(2,false);
    window(q,25);window(q,25);
    const reduced=q.dpr;
    window(q,60);window(q,60);window(q,60);
    expect(q.dpr).toBe(reduced);
    window(q,60);
    expect(q.dpr).toBeGreaterThan(reduced);
    expect(q.dpr).toBeLessThanOrEqual(1.5);
  });
  it('supports low device ratios and rejects invalid samples',()=>{
    const q=createResolutionGovernor(.8,true);
    expect(q.maxDpr).toBe(.8);
    expect(q.minDpr).toBe(.72);
    expect(q.sample(Number.NaN).changed).toBe(false);
    expect(q.sample(0).changed).toBe(false);
    expect(q.sample(5).changed).toBe(false);
    expect(q.dpr).toBe(.8);
  });
});
