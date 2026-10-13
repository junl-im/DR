import {describe,expect,it} from 'vitest';
import {entryScaleForViewport} from './entry-fit';

describe('title screen visual viewport sizing',()=>{
  it('keeps tall, densely populated entry cards within the mobile height',()=>{
    const scale=entryScaleForViewport(320,568,320,940);
    expect(scale).toBeLessThan(1);
    expect(scale*940).toBeLessThanOrEqual(568-24);
    expect(scale*320).toBeLessThanOrEqual(320-20);
  });
  it('accounts for horizontal overflow even on a desktop-height screen',()=>{
    const scale=entryScaleForViewport(320,1024,500,300);
    expect(scale*500).toBeLessThanOrEqual(300);
  });
  it('never enlarges content and supports keyboard-reduced viewport heights',()=>{
    expect(entryScaleForViewport(1440,900,1000,600)).toBe(1);
    expect(entryScaleForViewport(390,300,390,780))
      .toBeLessThan(entryScaleForViewport(390,844,390,780));
  });
  it('does not produce NaN or an infinite scaling transform for malformed values',()=>{
    expect(Number.isFinite(entryScaleForViewport(NaN,1000,0,NaN))).toBe(true);
    expect(entryScaleForViewport(0,0,0,0)).toBeGreaterThan(0);
  });
});
