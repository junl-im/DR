import * as THREE from 'three';
import type {SceneObjectSpec} from './village';

/** Low-cost, deterministic cobblestone texture; no external asset or Canvas needed. */
export const TOWN_PAVING_PIXELS = 256;
export function makePavingPixels(seed=20261012, size=TOWN_PAVING_PIXELS): Uint8Array {
  const data=new Uint8Array(size*size*4);
  const stone=16;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const row=Math.floor(y/stone),rowY=y%stone;
    const stagger=(row%2)*(stone/2);
    const stoneX=x+stagger;
    const col=Math.floor(stoneX/stone),insetX=stoneX%stone;
    // Rounded-away corners create small individual masonry joints, rather
    // than long uninterrupted checkerboard grout seams.
    const edge=Math.min(insetX,stone-insetX-1,rowY,stone-rowY-1);
    const corner=Math.min(insetX,stone-insetX-1)+Math.min(rowY,stone-rowY-1);
    const grout=edge<2||corner<5;
    const blockHash=(Math.imul(col*29+row*131+seed,1103515245)>>>10)&255;
    const grain=((Math.imul(x*91+y*47+seed,1664525)>>>16)&15)-7;
    const chip=((Math.imul(x*137+y*311+seed,22695477)>>>23)&7);
    const moss=grout&&blockHash%5===0&&chip<3;
    const base=grout?77+blockHash%18:151+blockHash%39+grain;
    const i=(y*size+x)*4;
    data[i]=Math.max(0,Math.min(255,base+(moss?-5:14)));
    data[i+1]=Math.max(0,Math.min(255,base+(moss?18:7)));
    data[i+2]=Math.max(0,Math.min(255,base+(moss?-3:-4)));
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
    new THREE.MeshStandardMaterial({map:texture,roughness:1,metalness:0,color:0xffffff})
  );
  mesh.name='village-ground';
  mesh.position.set(spec.x,spec.y,spec.z);
  mesh.receiveShadow=true;
  mesh.castShadow=false;
  // Art only. Paths and collision remain entirely under @nj/game-core.
  mesh.userData['decorative']=true;
  return mesh;
}
