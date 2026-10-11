import * as THREE from 'three';
import type {SceneObjectSpec} from './village';

/** Low-cost, deterministic cobblestone texture; no external asset or Canvas needed. */
export const TOWN_PAVING_PIXELS = 128;
export function makePavingPixels(seed=20261012, size=TOWN_PAVING_PIXELS): Uint8Array {
  const data=new Uint8Array(size*size*4);
  const stone=16;
  for(let y=0;y<size;y++) for(let x=0;x<size;x++){
    const col=Math.floor(x/stone),row=Math.floor(y/stone);
    const insetX=x%stone, insetY=y%stone;
    const offset=(row%2)*8;
    const staggeredX=(x+offset)%stone;
    const border=staggeredX<2||insetY<2;
    const hash=(Math.imul(col+row*13+seed,1103515245)>>>10)&255;
    const grain=((Math.imul(x*91+y*47+seed,1664525)>>>16)&7)-3;
    const shade=border?72:145+(hash%34)-17+grain;
    const i=(y*size+x)*4;
    data[i]=Math.min(255,shade+17);
    data[i+1]=Math.min(255,shade+7);
    data[i+2]=Math.min(255,shade-2);
    data[i+3]=255;
  }
  return data;
}
export function createVillagePaving(spec:SceneObjectSpec):THREE.Mesh {
  const texture=new THREE.DataTexture(makePavingPixels(),TOWN_PAVING_PIXELS,TOWN_PAVING_PIXELS,THREE.RGBAFormat);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.magFilter=THREE.LinearFilter;
  texture.minFilter=THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps=true;
  texture.repeat.set(spec.width/14,spec.depth/14);
  texture.needsUpdate=true;
  const mesh=new THREE.Mesh(
    new THREE.BoxGeometry(spec.width,spec.height,spec.depth),
    new THREE.MeshStandardMaterial({map:texture,roughness:1,metalness:0,color:0xd1c6ad})
  );
  mesh.name='village-ground';
  mesh.position.set(spec.x,spec.y,spec.z);
  mesh.receiveShadow=true;
  mesh.castShadow=false;
  // Art only. Paths and collision remain entirely under @nj/game-core.
  mesh.userData['decorative']=true;
  return mesh;
}
