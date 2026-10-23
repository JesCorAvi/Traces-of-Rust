// Motas de luz y sal marina que flotan en el aire del atardecer.
// Exports: createDust.

import * as THREE from 'three';

function makeMoteTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
  g.addColorStop(0, 'rgba(255, 249, 218, 1)');
  g.addColorStop(0.35, 'rgba(255, 224, 153, 0.85)');
  g.addColorStop(1, 'rgba(255, 199, 112, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 16, 16);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  return tex;
}

export function createDust(scene) {
  const dustGeo = new THREE.BufferGeometry();
  const dustPts = new Float32Array(280 * 3);
  for (let i = 0; i < 280; i++) {
    dustPts[i * 3] = (Math.random() - 0.5) * 80;
    dustPts[i * 3 + 1] = 0.4 + Math.random() * 7.2;
    dustPts[i * 3 + 2] = (Math.random() - 0.5) * 80;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPts, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      map: makeMoteTexture(),
      color: 0xffe6ad,
      size: 0.1,
      transparent: true,
      opacity: 0.55,
      alphaTest: 0.02,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    })
  );
  scene.add(dust);
  return dust;
}
