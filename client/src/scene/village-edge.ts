import * as THREE from 'three';
import type {SceneObjectSpec} from './village';

/** Visually softens the abrupt 40 m stone/grass boundary without changing
 * collision, pathfinding, playable space, or game-core terrain height.
 * Exactly two instanced draw-call batches even on mobile.
 */
export const VILLAGE_EDGE_NAME = 'dungeon-zero-village-edge';
export const VILLAGE_EDGE_BATCHES = 2;

export interface VillageEdgePlan {
  chips:Array<{x:number;z:number;shade:number;turn:number}>;
  verge:Array<{x:number;z:number;shade:number;turn:number}>;
}

function hash(x:number,z:number,seed=20261012):number {
  let h=(Math.imul(x+201,374761393)^Math.imul(z+43,668265263)^seed)>>>0;
  h=Math.imul(h^(h>>>13),1274126177)>>>0;
  return (h^(h>>>16))>>>0;
}

export function planVillageEdge(specs:readonly SceneObjectSpec[]):VillageEdgePlan {
  const ground=specs.find(x=>x.kind==='ground');
  if(!ground)return {chips:[],verge:[]};
  const halfW=ground.width/2, halfD=ground.depth/2;
  const chips:VillageEdgePlan['chips']=[],verge:VillageEdgePlan['verge']=[];
  const steps=32;
  for(let side=0;side<4;side++){
    for(let i=0;i<steps;i++){
      const along=(i+.5)/steps*2-1;
      const a=side<2?ground.z+along*(halfD-1.1):ground.x+along*(halfW-1.1);
      const outside=side%2===0?1:-1;
      // north and south shop approaches stay free of decorative edging.
      if(side>=2&&Math.abs(a-ground.x)<2.4)continue;
      const index=side*steps+i;
      const variant=hash(index,side);
      const indent=.43+(variant%8)*.075; // all chips inside slab boundary
      const offset=.55+((variant>>>7)%9)*.13; // verge outside slab boundary
      const chipX=side<2?ground.x+outside*(halfW-indent):a;
      const chipZ=side>=2?ground.z+outside*(halfD-indent):a;
      const vergeX=side<2?ground.x+outside*(halfW+offset):a;
      const vergeZ=side>=2?ground.z+outside*(halfD+offset):a;
      chips.push({x:chipX,z:chipZ,shade:variant%5,turn:((variant>>>16)%21-10)*.03});
      verge.push({x:vergeX,z:vergeZ,shade:(variant>>>11)%4,turn:((variant>>>20)%31-15)*.065});
    }
  }
  return {chips,verge};
}

function instanced(name:string,geo:THREE.BufferGeometry,count:number):THREE.InstancedMesh {
  const mesh=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({
    color:0xffffff,metalness:0,roughness:1,flatShading:true,
    side:name==='village-edge-grass'?THREE.DoubleSide:THREE.FrontSide,
  }),count);
  mesh.name=name;
  mesh.raycast=()=>{};
  mesh.userData['decorative']=true;
  mesh.castShadow=false;
  mesh.receiveShadow=false;
  return mesh;
}

/** Terrain sampleHeight is injected from the same mesh generator used by the
 * live scene, so wild grasses touch the actual slope outside the paved plaza.
 */
export function buildVillageEdge(
  scene:THREE.Scene,
  specs:readonly SceneObjectSpec[],
  sampleHeight:(x:number,z:number)=>number,
):THREE.Group {
  const existing=scene.getObjectByName(VILLAGE_EDGE_NAME);
  if(existing)return existing as THREE.Group;
  const root=new THREE.Group();
  root.name=VILLAGE_EDGE_NAME;
  const ground=specs.find(s=>s.kind==='ground');
  if(!ground){scene.add(root);return root;}
  const plan=planVillageEdge(specs);
  const stone=instanced('village-edge-gravel',new THREE.DodecahedronGeometry(.21,0),plan.chips.length);
  const grass=instanced('village-edge-grass',new THREE.ConeGeometry(.15,.56,5),plan.verge.length);
  const colorsStone=[0x857e6d,0xa49d8b,0xb3ab93,0x8a8d76,0x979383];
  const colorsGrass=[0x59773c,0x7b9653,0x91a76a,0x677f46];
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),rotation=new THREE.Quaternion();
  const scale=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
  for(const [mesh,items,colors] of [
    [stone,plan.chips,colorsStone],
    [grass,plan.verge,colorsGrass],
  ] as const){
    for(let i=0;i<items.length;i++){
      const item=items[i];
      const height=mesh===stone?ground.y+ground.height/2+.005:sampleHeight(item.x,item.z);
      if(!Number.isFinite(height))throw new Error('Invalid village edge terrain height');
      const variation=(hash(i,mesh===stone?3:7)%11)/20;
      position.set(item.x,height+(mesh===stone ? .105 : .27),item.z);
      rotation.setFromAxisAngle(up,item.turn);
      const factor=.78+variation;
      scale.set(factor,mesh===stone ? .65+variation*.3 : factor,factor);
      matrix.compose(position,rotation,scale);
      mesh.setMatrixAt(i,matrix);
      mesh.setColorAt(i,new THREE.Color(colors[item.shade]));
    }
    mesh.instanceMatrix.needsUpdate=true;
    if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    mesh.computeBoundingSphere();
    root.add(mesh);
  }
  scene.add(root);
  return root;
}

/** The root only owns these two geometries and materials, never shared GLBs. */
export function disposeVillageEdge(scene:THREE.Scene):void {
  const root=scene.getObjectByName(VILLAGE_EDGE_NAME);
  if(!root)return;
  for(const child of root.children){
    if(child instanceof THREE.InstancedMesh){
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
    }
  }
  root.removeFromParent();
}
