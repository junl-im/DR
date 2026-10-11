import * as THREE from 'three';

/** Local prototype palette: generated texture and village roads, no external art. */
export function applyClassicScene(scene: THREE.Scene): void {
  scene.background = new THREE.Color('#aaa995');
  scene.fog = new THREE.Fog('#aaa995', 100, 230);
  let seed = 9713;
  const pixels = new Uint8Array(128 * 128 * 4);
  for (let i = 0; i < pixels.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const gray = 170 + (seed >>> 26);
    pixels[i] = gray; pixels[i + 1] = gray; pixels[i + 2] = gray; pixels[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(pixels, 128, 128, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true; texture.needsUpdate = true;
  scene.traverse(object => {
    if (!(object instanceof THREE.Mesh) || !object.receiveShadow) return;
    const positions = object.geometry.getAttribute('position');
    // The terrain is the one large indexed mesh; props keep their source palette.
    if (!positions || positions.count < 16000 || !(object.material instanceof THREE.MeshLambertMaterial)) return;
    const colors = new Float32Array(positions.count * 3);
    const grass = new THREE.Color('#83915b'), road = new THREE.Color('#c1ae89');
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), z = positions.getZ(i);
      const lane = Math.min(Math.abs(x), Math.abs(z));
      const roadWeight = Math.max(0, Math.min(1, (4 - lane) / 2)) * Math.max(0, Math.min(1, (32 - Math.hypot(x, z)) / 8));
      const color = grass.clone().lerp(road, roadWeight);
      color.toArray(colors, i * 3);
    }
    object.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    object.material.color.set('#ffffff'); object.material.map = texture;
    object.material.vertexColors = true; object.material.flatShading = false; object.material.needsUpdate = true;
  });
}

