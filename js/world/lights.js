// Antorchas tiki y luces cálidas del campamento de playa.
// Exports: createBeachLights.

import * as THREE from 'three';
import { terrainHeightAt } from './terrain.js';
import { isNearDefenseRouteOrSpawn } from './routeClearance.js';

export function createBeachLights(scene, materials) {
  const lights = [];
  const flameGeo = new THREE.ConeGeometry(0.16, 0.5, 6, 1);
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffc45c, transparent: true, opacity: 0.95 });
  const emberMat = new THREE.MeshBasicMaterial({ color: 0xff7a38 });

  const spots = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 + 0.2;
    const radius = 16 + (i % 3) * 7;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius + 4;
    if (isNearDefenseRouteOrSpawn(x, z, 2.6)) continue;
    if (z < -40) continue;
    spots.push({ x, z });
  }

  spots.forEach((spot, i) => {
    const y = terrainHeightAt(spot.x, spot.z);
    const group = new THREE.Group();
    group.position.set(spot.x, y, spot.z);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 2.45, 6), materials.driftwoodMat);
    pole.position.y = 1.22;
    pole.castShadow = true;
    group.add(pole);

    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.13, 0.28, 7), materials.barrelMat);
    cup.position.y = 2.5;
    group.add(cup);

    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.y = 2.83;
    flame.scale.set(1, 1.1 + (i % 3) * 0.1, 1);
    group.add(flame);

    const ember = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), emberMat);
    ember.position.y = 2.62;
    group.add(ember);

    const light = new THREE.PointLight(0xffa04a, 8 + (i % 3) * 2, 12, 1.8);
    light.position.y = 2.85;
    group.add(light);

    scene.add(group);
    lights.push({ light, flame, ember, group, baseIntensity: light.intensity, phase: i * 0.9 });
  });

  return lights;
}
