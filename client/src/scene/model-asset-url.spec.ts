import {describe,expect,it} from 'vitest';
import {resolveModelAssetUrl} from './model-asset-url';

describe('bundled 3D model URLs on both hosting origins',()=>{
  it('preserves Firebase root models',()=>{
    expect(resolveModelAssetUrl('/models/monsters/Gremlin.glb','/')).toBe('/models/monsters/Gremlin.glb');
  });
  it('prefixes all shipped models for GitHub Pages under /DR/',()=>{
    expect(resolveModelAssetUrl('/models/monsters/Gremlin.glb','/DR/')).toBe('/DR/models/monsters/Gremlin.glb');
    expect(resolveModelAssetUrl('/models/npcs/Roxxy.glb','/DR/')).toBe('/DR/models/npcs/Roxxy.glb');
    expect(resolveModelAssetUrl('/models/props/environment/Building_0.glb','/DR/'))
      .toBe('/DR/models/props/environment/Building_0.glb');
  });
  it('does not rewrite outside URLs or already-correct paths',()=>{
    expect(resolveModelAssetUrl('https://example.org/models/mob.glb','/DR/')).toBe('https://example.org/models/mob.glb');
    expect(resolveModelAssetUrl('./models/mob.glb','/DR/')).toBe('./models/mob.glb');
    expect(resolveModelAssetUrl('/audio/sfx/step.mp3','/DR/')).toBe('/audio/sfx/step.mp3');
    expect(resolveModelAssetUrl('/DR/models/monsters/Gremlin.glb','/DR/')).toBe('/DR/models/monsters/Gremlin.glb');
  });
});
