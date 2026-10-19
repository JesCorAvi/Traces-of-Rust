// Polvo industrial flotante.
// Exports: createDust.

import * as THREE from 'three';

export function createDust(scene) {
  const dustGeo = new THREE.BufferGeometry();
  const dustPts = new Float32Array(500 * 3);
  for (let i = 0; i < 500; i++) {
    dustPts[i * 3] = (Math.random() - 0.5) * 80;
    dustPts[i * 3 + 1] = Math.random() * 6;
    dustPts[i * 3 + 2] = (Math.random() - 0.5) * 80;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPts, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({ color: 0x877a5c, size: 0.12, transparent: true, opacity: 0.45 })
  );
  scene.add(dust);
  return dust;
}
