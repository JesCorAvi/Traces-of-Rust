// Lámparas cenitales industriales.
// Exports: createCeilingLights.

import * as THREE from 'three';

export function createCeilingLights(scene) {
  const ceilingLights = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const r = 18 + (i % 2) * 20;
    const light = new THREE.PointLight(0xb89c46, 36, 30, 1.7);
    light.position.set(Math.cos(angle) * r, 6.6, Math.sin(angle) * r);
    scene.add(light);
    ceilingLights.push({ light, baseIntensity: 36 });
  }
  return ceilingLights;
}
