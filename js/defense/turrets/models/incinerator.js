// Modelo 3D del Asador de Playa: parrilla de coco con soplete de bambú.
// Exports: buildIncineratorModel.

import * as THREE from 'three';
import {
  addCoconut,
  addPalmLeaf,
  addBambooPole,
  addRopeBand,
  addEnergyRing,
  addShellDish,
  addGlowPearl
} from './parts.js';

export function buildIncineratorModel(turret) {
  // Carrito de parrilla en bambú.
  turret.addPart(new THREE.CylinderGeometry(0.46, 0.54, 0.26, 10), turret.bambooDarkMat, 0, 0.58, 0);
  turret.addPart(new THREE.CylinderGeometry(0.36, 0.42, 0.18, 10), turret.coconutMat, 0, 0.76, 0);

  // Brasas y parrilla.
  const emberMat = new THREE.MeshBasicMaterial({ color: 0xff7a3c });
  const embers = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 12), emberMat);
  embers.position.set(0, 0.86, 0);
  turret.modelRoot.add(embers);
  for (let i = -2; i <= 2; i++) {
    turret.addPart(new THREE.BoxGeometry(0.5, 0.035, 0.035), turret.bambooDarkMat, 0, 0.9, i * 0.1);
  }

  // Patas/hojas y depósitos de coco.
  for (const side of [-1, 1]) {
    addBambooPole(turret, side * 0.42, 0.52, 0.2, side * 0.62, 0.52, 0.3, 0.045);
    addCoconut(turret, side * 0.38, 0.65, 0.22, 0.13);
    addRopeBand(turret, side * 0.38, 0.65, 0.22, 0.18, { rx: Math.PI / 2 });
  }
  addPalmLeaf(turret, -0.5, 0.98, 0.18, {
    sx: 0.11, sy: 0.46, sz: 0.11, rx: 0.9, rz: -0.6
  });
  addPalmLeaf(turret, 0.5, 0.94, 0.12, {
    sx: 0.1, sy: 0.42, sz: 0.1, rx: 0.8, rz: 0.6, light: true
  });

  // Boquilla de bambú con retroceso.
  const nozzleGroup = new THREE.Group();
  nozzleGroup.position.set(0, 0.82, -0.12);
  turret.modelRoot.add(nozzleGroup);
  turret.barrelRecoilMesh = nozzleGroup;
  turret.barrelBaseZ = 0;

  const pipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.11, 0.72, 8),
    turret.bambooMat
  );
  pipe.rotation.x = Math.PI / 2;
  pipe.position.set(0, 0, -0.48);
  pipe.castShadow = true;
  nozzleGroup.add(pipe);
  addShellDish(turret, 0, 0, -0.9, {
    sx: 0.22, sy: 0.14, sz: 0.24, rx: -0.3, parent: nozzleGroup
  });
  addGlowPearl(turret, 0, -0.02, -1.04, 0.08, { parent: nozzleGroup });
  addEnergyRing(turret, 0, 0, -0.93, 0.17, { parent: nozzleGroup, rx: Math.PI / 2 });
  addRopeBand(turret, 0, 0, -0.34, 0.14, { parent: nozzleGroup, rx: Math.PI / 2 });

  // Mejoras: depósito extra, válvula y tanque de napalm.
  turret.addHiddenPart(
    'fuel_tank',
    new THREE.CylinderGeometry(0.18, 0.18, 0.46, 8),
    turret.coconutMat, 0.42, 0.62, -0.26, 0, 0, Math.PI / 2
  );
  turret.addHiddenPart(
    'pressure_valve',
    new THREE.TorusGeometry(0.14, 0.035, 6, 12),
    turret.glowMat, -0.26, 0.88, -0.18
  );
  turret.addHiddenPart(
    'napalm_tank',
    new THREE.SphereGeometry(0.17, 8, 6),
    turret.accentMat, 0, 1.0, 0.24
  );

  turret.muzzleHeight = 0.84;
  turret.muzzleForward = 1.18;
}
