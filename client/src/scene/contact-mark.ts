import * as THREE from 'three';

/** Grounded silhouette cue, rendered below the character with no interaction.
 * Geometry and material are avatar-owned and safely disposed with that avatar.
 */
export function createContactMark(radius=.6):THREE.Mesh {
  const disk=new THREE.Mesh(
    new THREE.CircleGeometry(radius,28),
    new THREE.MeshBasicMaterial({
      color:0x10140f,transparent:true,opacity:.27,
      depthWrite:false,side:THREE.DoubleSide,toneMapped:false,
    })
  );
  disk.name='character-ground-contact';
  disk.rotation.x=-Math.PI/2;
  disk.position.y=.07;
  disk.renderOrder=1;
  disk.castShadow=false;disk.receiveShadow=false;
  disk.userData['decorative']=true;
  disk.raycast=()=>{};
  return disk;
}
export function disposeContactMark(mark:THREE.Mesh):void {
  mark.removeFromParent();
  mark.geometry.dispose();
  const mats=Array.isArray(mark.material)?mark.material:[mark.material];
  mats.forEach(m=>m.dispose());
}
