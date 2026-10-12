import * as THREE from 'three';
import type {SceneObjectSpec} from './village';

export const VILLAGE_ROOFLINES_NAME='dungeon-zero-village-rooflines';
export const ROOFLINE_DRAW_BATCHES=5;

/** Exact dimensions of the 5 self-authored GLBs in scripts/build-houses.mjs.
 * These are cosmetics at existing world positions, not edits to world blockers.
 */
const profiles=[
  {w:6,d:5,wallH:3.2,roofH:2.4,roof:'gable',chimney:true,stone:0xb45340},
  {w:5,d:6,wallH:3.2,roofH:2.4,roof:'gable',chimney:false,stone:0x657281},
  {w:7,d:4,wallH:3.0,roofH:2.4,roof:'gable',chimney:true,stone:0xa87749},
  {w:5,d:5,wallH:3.4,roofH:2.4,roof:'gable',chimney:true,stone:0x635c68},
  {w:4,d:4,wallH:6.5,roofH:3.4,roof:'pyramid',chimney:false,stone:0x85858a},
] as const;

interface Placement {
  x:number; y:number; z:number;
  scale:[number,number,number];color:number;rotX?:number;rotY?:number;
}

function batch(
  name:string,geometry:THREE.BufferGeometry,items:readonly Placement[]
):THREE.InstancedMesh {
  const mesh=new THREE.InstancedMesh(geometry,new THREE.MeshStandardMaterial({
    color:0xffffff,roughness:.92,metalness:0,flatShading:true,
  }),items.length);
  mesh.name=name;
  mesh.userData['decorative']=true;
  mesh.raycast=()=>{};
  mesh.castShadow=false;
  mesh.receiveShadow=false;
  const matrix=new THREE.Matrix4(),q=new THREE.Quaternion();
  const p=new THREE.Vector3(),scale=new THREE.Vector3();
  for(let i=0;i<items.length;i++){
    const item=items[i];
    p.set(item.x,item.y,item.z);
    q.setFromEuler(new THREE.Euler(item.rotX??0,item.rotY??0,0));
    scale.set(...item.scale);
    matrix.compose(p,q,scale);
    mesh.setMatrixAt(i,matrix);
    mesh.setColorAt(i,new THREE.Color(item.color));
  }
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  mesh.computeBoundingSphere();
  return mesh;
}

export function buildVillageRooflines(scene:THREE.Scene,specs:readonly SceneObjectSpec[]):THREE.Group {
  const existing=scene.getObjectByName(VILLAGE_ROOFLINES_NAME);
  if(existing)return existing as THREE.Group;
  const root=new THREE.Group();
  root.name=VILLAGE_ROOFLINES_NAME;
  const buildings=specs.filter(x=>x.kind==='building');
  if(!buildings.length){scene.add(root);return root;}

  const tileItems:Placement[]=[],finials:Placement[]=[];
  const chimneyCaps:Placement[]=[],dormers:Placement[]=[],watchBand:Placement[]=[];
  buildings.forEach((spec,i)=>{
    const profile=profiles[i];
    if(!profile)return; // Future building content must supply its own source dimensions.
    const base=spec.y-spec.height/2;
    const wallTop=base+.7+profile.wallH;
    const x0=spec.x,z0=spec.z;

    if(profile.roof==='gable'){
      const halfD=profile.d/2+.6;
      const slope=Math.atan2(profile.roofH,halfD);
      const cols=6,rows=4;
      for(const side of [-1,1] as const){
        for(let col=0;col<cols;col++)for(let row=0;row<rows;row++){
          const u=(col+.5)/cols,v=(row+.5)/rows;
          const z=side*halfD*v;
          const roofY=wallTop+profile.roofH*(1-v);
          const tint=((col*5+row*3+i*7)%7-3)*.034;
          const baseColor=new THREE.Color(profile.stone).offsetHSL(0,0,tint);
          tileItems.push({
            x:x0+(u-.5)*(profile.w+.98),
            y:roofY+.16,z:z0+z,
            scale:[.84,.04,.92],color:baseColor.getHex(),rotX:side*slope,
          });
        }
      }
      // Ridge ornaments break identical gable silhouettes at differing x.
      finials.push({x:x0+(i%2===0?-.32:.32)*profile.w,y:wallTop+profile.roofH+.30,
        z:z0,scale:[.18,.54,.18],color:0xd7bf92});
    }else{
      // Watchtower: low-cost stone belt beneath a pyramidal roof and brass tip.
      finials.push({x:x0,y:wallTop+profile.roofH+.42,z:z0,
        scale:[.28,.82,.28],color:0xcbb47d});
      const y=wallTop-.35;
      for(const side of [-1,1] as const){
        watchBand.push({x:x0,y,z:z0+side*(profile.d/2+.14),
          scale:[profile.w+.35,.15,.24],color:0x7b7770});
        watchBand.push({x:x0+side*(profile.w/2+.14),y,z:z0,
          scale:[.24,.15,profile.d+.35],color:0x7b7770});
      }
    }

    if(profile.chimney){
      const cx=x0+profile.w/2-.9,cz=z0-profile.d/2+.9;
      chimneyCaps.push({x:cx,y:wallTop+profile.roofH+1.00,
        z:cz,scale:[.93,.18,.93],color:0x484b50});
    }
    // Two shop houses gain a small upper-front dormer; the existing house GLB
    // stays unchanged, and the new ornament does not extend to walkable space.
    if(i===1||i===3){
      const hD=profile.d/2+.6,v=.35;
      const z=z0+hD*v,roofY=wallTop+profile.roofH*(1-v);
      dormers.push({x:x0+profile.w*.19,y:roofY+.38,z,
        scale:[.95,.72,.68],color:0xc8b69c});
    }
  });
  const tileGeo=new THREE.BoxGeometry(.98,.1,.71);
  const pointGeo=new THREE.ConeGeometry(.52,1,6);
  const chimneyGeo=new THREE.BoxGeometry(1,1,1);
  const dormerGeo=new THREE.BoxGeometry(1,1,1);
  const bandGeo=new THREE.BoxGeometry(1,1,1);
  for(const mesh of [
    batch('village-roof-shingles',tileGeo,tileItems),
    batch('village-roof-finials',pointGeo,finials),
    batch('village-chimney-caps',chimneyGeo,chimneyCaps),
    batch('village-roof-dormers',dormerGeo,dormers),
    batch('village-watchtower-belt',bandGeo,watchBand),
  ])root.add(mesh);
  scene.add(root);
  return root;
}

export function disposeVillageRooflines(scene:THREE.Scene):void {
  const root=scene.getObjectByName(VILLAGE_ROOFLINES_NAME);
  if(!root)return;
  root.traverse(child=>{
    if(child instanceof THREE.InstancedMesh){
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
    }
  });
  root.removeFromParent();
}
