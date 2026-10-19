// Jaula orbital: unidad que gira alrededor del jugador.
// Exports: createOrbitalUnit.

import * as THREE from 'three';
import { setPlaneFrameUV } from '../../entities.js';
import { SHARED_MAT } from '../shared.js';

export function createOrbitalUnit(scene, angle) {
  const group = new THREE.Group();
  const geo = new THREE.PlaneGeometry(1.35, 1.35);
  setPlaneFrameUV(geo, 4, 1, 0, 0);

  const sprite = new THREE.Mesh(geo, SHARED_MAT.orbitalMat);
  group.add(sprite);
  scene.add(group);

  return { group, sprite, geo, angle, animTimer: Math.random(), trailTimer: 0, hitCd: 0 };
}
