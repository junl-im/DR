import {describe,expect,it} from 'vitest';
import * as THREE from 'three';
import {applyInspectionCamera,frameInspectionCamera} from './art-inspection-camera';

function character() {
  const root=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(.8,2,.55),new THREE.MeshBasicMaterial());
  body.position.y=1;
  const hand=new THREE.Bone();
  hand.name='palm_R';
  hand.position.set(.6,1.35,.18);
  const mesh=new THREE.SkinnedMesh(new THREE.BoxGeometry(.2,.2,.2),new THREE.MeshBasicMaterial());
  mesh.bind(new THREE.Skeleton([hand]));
  root.add(body,hand,mesh);
  return {root,hand};
}
describe('art inspection camera',()=>{
  it('frames the posed palm_R as the exact target, including after a bone animation',()=>{
    const {root,hand}=character();
    const first=frameInspectionCamera(root,'front','hands');
    expect(first.target.distanceTo(hand.getWorldPosition(new THREE.Vector3()))).toBeLessThan(1e-5);
    hand.position.y+=.45;
    hand.position.x-=.2;
    const second=frameInspectionCamera(root,'front','hands');
    expect(second.target.distanceTo(hand.getWorldPosition(new THREE.Vector3()))).toBeLessThan(1e-5);
    expect(second.target.y-first.target.y).toBeCloseTo(.45,5);
  });

  it('rotates around the same full-body target without modifying the character',()=>{
    const {root}=character();
    const original=root.matrixWorld.clone();
    const front=frameInspectionCamera(root,'front','full');
    const side=frameInspectionCamera(root,'side','full');
    const back=frameInspectionCamera(root,'back','full');
    expect(side.target.distanceTo(front.target)).toBeLessThan(1e-5);
    expect(back.target.distanceTo(front.target)).toBeLessThan(1e-5);
    expect(front.position.z-front.target.z).toBeGreaterThan(0);
    expect(back.position.z-back.target.z).toBeLessThan(0);
    expect(side.position.x-side.target.x).toBeGreaterThan(0);
    expect(root.matrixWorld.equals(original)).toBe(true);
  });

  it('provides closer views for helmet and boots without near clipping',()=>{
    const {root}=character();
    const full=frameInspectionCamera(root,'three-quarter','full');
    const head=frameInspectionCamera(root,'three-quarter','head');
    const feet=frameInspectionCamera(root,'three-quarter','feet');
    expect(head.target.y).toBeGreaterThan(feet.target.y);
    expect(head.position.distanceTo(head.target)).toBeLessThan(full.position.distanceTo(full.target));
    expect(head.near).toBeLessThan(.05);
    const camera=new THREE.PerspectiveCamera(30,1,.1,100);
    applyInspectionCamera(camera,head);
    expect(camera.near).toBeCloseTo(head.near);
    expect(camera.getWorldDirection(new THREE.Vector3()).dot(head.target.clone().sub(head.position).normalize())).toBeGreaterThan(.99);
  });

  it('rejects invalid zoom or view values rather than producing a broken projection',()=>{
    const {root}=character();
    expect(()=>frameInspectionCamera(root,'front','hands',Infinity)).toThrow('Invalid');
    expect(()=>frameInspectionCamera(root,'side','full',0)).toThrow('Invalid');
    expect(()=>frameInspectionCamera(root,'front','unknown' as never)).toThrow('Invalid');
    expect(()=>frameInspectionCamera(new THREE.Group(),'front','full')).toThrow('no visible bounds');
  });
});
