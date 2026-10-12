import {describe,it,expect} from 'vitest';
import {externalBrowserUrl,mobileEnvironment} from './mobile-shell';
describe('mobile browser fallbacks',()=>{
 it('distinguishes Kakao Android, Kakao iOS and desktop',()=>{
  expect(mobileEnvironment('Android KAKAOTALK 26')).toEqual({kakao:true,android:true,ios:false});
  expect(mobileEnvironment('iPhone KakaoTalk')).toEqual({kakao:true,android:false,ios:true});
  expect(mobileEnvironment('Chrome Windows')).toEqual({kakao:false,android:false,ios:false});
 });
 it('preserves the actual Pages route and query in both external browser paths',()=>{
  const url='https://junl-im.github.io/DR/?art=traveler&x=a%20b';
  expect(externalBrowserUrl(url,true)).toContain('intent://junl-im.github.io/DR/?art=traveler&x=a%20b#Intent;scheme=https;');
  expect(externalBrowserUrl(url,true)).toContain('S.browser_fallback_url='+encodeURIComponent(url));
  expect(externalBrowserUrl(url,false)).toBe('kakaotalk://web/openExternal?url='+encodeURIComponent(url));
  expect(()=>externalBrowserUrl('javascript:alert(1)',true)).toThrow();
 });
});
