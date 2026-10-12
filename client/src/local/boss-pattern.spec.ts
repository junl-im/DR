import {describe,it,expect} from 'vitest';
import {bossHit,bossRadius,bossDamage,bossWarningLabel,bossWindup,selectBossMove} from './boss-pattern';
describe('two readable boss attack patterns',()=>{
  it('alternates final guardian casts without consuming combat RNG',()=>{
    expect(Array.from({length:6},(_,i)=>selectBossMove('폐허의 파수꾼',i)))
      .toEqual(['aimed-strike','ground-sweep','aimed-strike','ground-sweep','aimed-strike','ground-sweep']);
    expect(selectBossMove('숲의 정예 감시자',7)).toBe('aimed-strike');
  });
  it('aimed circle follows snapshotted aim, not subsequent target movement',()=>{
    expect(bossHit('aimed-strike',0,0,3,0,3,0)).toBe(true);
    expect(bossHit('aimed-strike',0,0,3,0,5.31,0)).toBe(false);
    expect(bossHit('aimed-strike',0,0,3,0,7,0)).toBe(false);
    expect(bossRadius('aimed-strike')).toBe(2.3);
  });
  it('sweep allows moving beyond its radius, with a longer warning window',()=>{
    expect(bossHit('ground-sweep',0,0,0,0,5.5,0)).toBe(true);
    expect(bossHit('ground-sweep',0,0,0,0,5.6,0)).toBe(false);
    expect(bossHit('ground-sweep',0,0,0,0,Number.NaN,2)).toBe(false);
    expect(bossWindup('ground-sweep')).toBeGreaterThan(bossWindup('aimed-strike'));
    expect(bossDamage('ground-sweep')).toBeLessThan(bossDamage('aimed-strike'));
    expect(bossWarningLabel({name:'수호자',move:'ground-sweep',x:0,z:0,seconds:.6,radius:5.5})).toContain('범위 밖');
  });
});
