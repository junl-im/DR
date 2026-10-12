import {describe,it,expect} from 'vitest';
import {nameplateScreenPoint} from './screen-name-anchor';

describe('pixel-stable overhead local name anchor',()=>{
  it('centers the name independently of desktop and narrow mobile CSS canvas sizes',()=>{
    expect(nameplateScreenPoint({x:0,y:0,z:.5},{left:0,top:0,width:1440,height:744})).toEqual({x:720,y:372});
    expect(nameplateScreenPoint({x:0,y:0,z:.5},{left:0,top:0,width:390,height:626})).toEqual({x:195,y:313});
    expect(nameplateScreenPoint({x:.25,y:-.5,z:.25},{left:5,top:25,width:400,height:600})).toEqual({x:255,y:475});
  });
  it('hides when the player leaves the camera frustum or NDC is invalid',()=>{
    const r={left:0,top:0,width:390,height:626};
    expect(nameplateScreenPoint({x:1,y:0,z:0},r)).toBeNull();
    expect(nameplateScreenPoint({x:0,y:.99,z:0},r)).toBeNull();
    expect(nameplateScreenPoint({x:0,y:0,z:1.1},r)).toBeNull();
    expect(nameplateScreenPoint({x:0,y:0,z:-1.1},r)).toBeNull();
    expect(nameplateScreenPoint({x:NaN,y:0,z:0},r)).toBeNull();
    expect(nameplateScreenPoint({x:0,y:0,z:0},{...r,height:0})).toBeNull();
  });
});
