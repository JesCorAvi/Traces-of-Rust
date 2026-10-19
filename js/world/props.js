// Pilares oxidados como billboards alrededor del escenario.
// Exports: buildWorldProps.

import * as THREE from 'three';
import { isNearDefenseRouteOrSpawn } from './routeClearance.js';

export function buildWorldProps(scene, materials) {
  const propBillboards = [];
  const pillarMat = materials.pillarMat;
  for (let i = 0; i < 85; i++) {
    const x = (Math.random() - 0.5) * 200;
    const z = (Math.random() - 0.5) * 200;
    if (Math.hypot(x, z) < 16) continue;
    if (isNearDefenseRouteOrSpawn(x, z)) continue;
    const h = 5.2 + Math.random() * 1.8;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.7, h), pillarMat);
    mesh.position.set(x, h / 2, z);
    mesh.castShadow = true;
    scene.add(mesh);
    propBillboards.push(mesh);
  }
  return propBillboards;
}
