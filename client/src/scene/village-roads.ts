import * as THREE from 'three';
import type {SceneObjectSpec} from './village';

export const VILLAGE_ROADS_NAME='dungeon-zero-village-roads';
export const ROAD_GRID_METERS=1;

/** Pure decoration; cannot change game-core blockers, clicking, or NPC paths.
 * All stones sit a few centimeters over the existing 40 m plaza floor.
 */
export interface RoadPlan {
  stones: Array<{x:number;z:number;shade:number}>;
  entrances: Array<{x:number;z:number;houseX:number;houseZ:number}>;
}

function gridHash(x:number,z:number):number {
  return (Math.imul(x+127,374761393)^Math.imul(z-31,668265263))>>>0;
}

export function planVillageRoads(specs:readonly SceneObjectSpec[]):RoadPlan {
  const ground=specs.find(x=>x.kind==='ground');
  if(!ground)return {stones:[],entrances:[]};
  const buildings=specs.filter(x=>x.kind==='building');
  const stones=new Map<string,{x:number;z:number;shade:number}>();
  const xmin=ground.x-ground.width/2+.6,xmax=ground.x+ground.width/2-.6;
  const zmin=ground.z-ground.depth/2+.6,zmax=ground.z+ground.depth/2-.6;
  const isClear=(x:number,z:number):boolean=>
    buildings.every(b=>Math.abs(x-b.x)>b.width/2+.48||
      Math.abs(z-b.z)>b.depth/2+.48);
  const add=(x:number,z:number):void=>{
    x=Math.round(x/ROAD_GRID_METERS)*ROAD_GRID_METERS;
    z=Math.round(z/ROAD_GRID_METERS)*ROAD_GRID_METERS;
    if(x<xmin||x>xmax||z<zmin||z>zmax||!isClear(x,z))return;
    const key=`${x}:${z}`;
    if(!stones.has(key))stones.set(key,{x,z,shade:gridHash(x,z)%5});
  };
  const fill=(minX:number,maxX:number,minZ:number,maxZ:number):void=>{
    for(let x=Math.ceil(minX);x<=Math.floor(maxX);x++){
      for(let z=Math.ceil(minZ);z<=Math.floor(maxZ);z++)add(x,z);
    }
  };
  // Shared walking axes, with the southern and northern shopfront lanes.
  fill(-1,1,-9,17);
  fill(-14,14,-4.5,-2.5);
  fill(-12,10,15,17);

  const entrances:RoadPlan['entrances']=[];
  for(const b of buildings){
    // Existing hand-authored GLBs face +Z. Leave a full meter outside
    // the collision AABB before the first visually raised door step.
    const near=b.z+b.depth/2+1.05;
    const snapZ=Math.round(near);
    if(b.x>=xmin&&b.x<=xmax&&snapZ>=zmin&&snapZ<=zmax&&isClear(b.x,snapZ)){
      entrances.push({x:b.x,z:snapZ,houseX:b.x,houseZ:b.z});
    }
    const lane=b.z<0?-4:16;
    fill(b.x-1,b.x+1,Math.min(snapZ,lane),Math.max(snapZ,lane));
  }
  return {stones:[...stones.values()].sort((a,b)=>a.x-b.x||a.z-b.z),entrances};
}

function makeInstanced(
  name:string,geometry:THREE.BufferGeometry,count:number,roughness=1
):THREE.InstancedMesh {
  const mesh=new THREE.InstancedMesh(geometry,
    new THREE.MeshStandardMaterial({color:0xffffff,roughness,metalness:0,flatShading:true}),
    count);
  mesh.name=name;
  mesh.userData['decorative']=true;
  mesh.raycast=()=>{};
  mesh.castShadow=false;
  mesh.receiveShadow=false;
  return mesh;
}

export function buildVillageRoads(scene:THREE.Scene,specs:readonly SceneObjectSpec[]):THREE.Group {
  const existing=scene.getObjectByName(VILLAGE_ROADS_NAME);
  if(existing)return existing as THREE.Group;
  const root=new THREE.Group();
  root.name=VILLAGE_ROADS_NAME;
  const ground=specs.find(x=>x.kind==='ground');
  if(!ground){scene.add(root);return root;}
  const plan=planVillageRoads(specs);
  const y=ground.y+ground.height/2+.033;
  const shades=[0xb5aa94,0xc0b5a0,0xaba48f,0xc2b8a7,0xa89b86];
  const matrix=new THREE.Matrix4();
  const pos=new THREE.Vector3(),rot=new THREE.Quaternion(),scale=new THREE.Vector3();
  const stones=makeInstanced('village-road-cobbles',new THREE.BoxGeometry(.87,.065,.87),plan.stones.length);
  for(let i=0;i<plan.stones.length;i++){
    const p=plan.stones[i];
    pos.set(p.x,y,p.z);scale.set(1,1,1);rot.identity();
    matrix.compose(pos,rot,scale);stones.setMatrixAt(i,matrix);
    stones.setColorAt(i,new THREE.Color(shades[p.shade]));
  }
  stones.instanceMatrix.needsUpdate=true;
  if(stones.instanceColor)stones.instanceColor.needsUpdate=true;
  stones.computeBoundingSphere();
  root.add(stones);

  const steps=makeInstanced('village-door-steps',new THREE.BoxGeometry(1.4,.085,.7),plan.entrances.length);
  for(let i=0;i<plan.entrances.length;i++){
    const e=plan.entrances[i];
    pos.set(e.x,y+.012,e.z);rot.identity();scale.set(1,1,1);
    matrix.compose(pos,rot,scale);steps.setMatrixAt(i,matrix);
    steps.setColorAt(i,new THREE.Color(0x928675));
  }
  steps.instanceMatrix.needsUpdate=true;
  if(steps.instanceColor)steps.instanceColor.needsUpdate=true;
  steps.computeBoundingSphere();
  root.add(steps);
  scene.add(root);
  return root;
}

export function disposeVillageRoads(scene:THREE.Scene):void {
  const root=scene.getObjectByName(VILLAGE_ROADS_NAME);
  if(!root)return;
  root.traverse(node=>{
    if(node instanceof THREE.InstancedMesh){
      node.geometry.dispose();
      (node.material as THREE.Material).dispose();
    }
  });
  root.removeFromParent();
}
