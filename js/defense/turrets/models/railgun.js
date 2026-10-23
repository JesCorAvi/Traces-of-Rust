// Modelo 3D del Arpón Perforante: ballesta de palma con raíles de bambú.
// Exports: buildRailgunModel.

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

export function buildRailgunModel(turret) {
  // Cureña de bambú.
  turret.addPart(new THREE.CylinderGeometry(0.34, 0.46, 0.26, 8), turret.bambooDarkMat, 0, 0.6, 0);
  turret.addPart(new THREE.BoxGeometry(0.6, 0.18, 0.56), turret.bambooMat, 0, 0.78, 0);

  const railGroup = new THREE.Group();
  railGroup.position.set(0, 0.92, 0);
  turret.modelRoot.add(railGroup);
  turret.barrelRecoilMesh = railGroup;
  turret.barrelBaseZ = 0;

  // Dos raíles largos y travesaños.
  addBambooPole(turret, -0.13, 0, 0.22, -0.13, 0, -1.52, 0.045, {
    parent: railGroup, material: turret.bambooMat
  });
  addBambooPole(turret, 0.13, 0, 0.22, 0.13, 0, -1.52, 0.045, {
    parent: railGroup, material: turret.bambooMat
  });
  for (const z of [0.16, -0.22, -0.72, -1.32]) {
    addBambooPole(turret, -0.2, 0, z, 0.2, 0, z, 0.035, {
      parent: railGroup, material: turret.bambooDarkMat
    });
  }

  // Arcos de tensión de palma y cuerda.
  addBambooPole(turret, -0.13, 0, -0.82, -0.58, 0.12, -0.62, 0.045, {
    parent: railGroup
  });
  addBambooPole(turret, 0.13, 0, -0.82, 0.58, 0.12, -0.62, 0.045, {
    parent: railGroup
  });
  addBambooPole(turret, -0.58, 0.12, -0.62, 0.58, 0.12, -0.62, 0.018, {
    parent: railGroup, material: turret.ropeMat
  });
  addRopeBand(turret, 0, 0, -0.82, 0.2, { parent: railGroup, rx: Math.PI / 2 });

  // Proyectil vivo en la guía y bobinas de energía.
  addShellDish(turret, 0, 0.15, -0.9, {
    sx: 0.2, sy: 0.11, sz: 0.2, rx: -0.3, parent: railGroup
  });
  addGlowPearl(turret, 0, 0.13, -1.02, 0.09, { parent: railGroup });
  for (let i = 0; i < 3; i++) {
    addEnergyRing(turret, 0, 0, -0.36 - i * 0.32, 0.2, {
      parent: railGroup, rx: Math.PI / 2
    });
  }

  // Visor de concha y culata de coco.
  addCoconut(turret, 0, 0, 0.28, 0.17, { parent: railGroup });
  addBambooPole(turret, 0, 0.14, -0.26, 0, 0.24, -0.54, 0.032, {
    parent: railGroup, material: turret.bambooDarkMat
  });
  addGlowPearl(turret, 0, 0.28, -0.6, 0.055, { parent: railGroup });

  addPalmLeaf(turret, -0.3, 0.34, 0.08, {
    sx: 0.1, sy: 0.52, sz: 0.1, rx: 0.4, rz: -0.6
  });
  addPalmLeaf(turret, 0.32, 0.3, 0.1, {
    sx: 0.09, sy: 0.46, sz: 0.09, rx: 0.5, rz: 0.7, light: true
  });
  addRopeBand(turret, 0, 0.16, -0.9, 0.25, { rx: Math.PI / 2 });

  // Mejoras: raíl largo, banco de bobinas y visor de precisión.
  turret.addHiddenPart(
    'long_rail',
    new THREE.BoxGeometry(0.065, 0.065, 1.8),
    turret.coconutFleshMat, 0, 0.92, -1.12
  );
  turret.addHiddenPart(
    'coil_bank',
    new THREE.TorusGeometry(0.23, 0.04, 6, 16),
    turret.glowMat, 0, 0.92, -1.28, Math.PI / 2, 0, 0
  );
  turret.addHiddenPart(
    'scope',
    new THREE.CylinderGeometry(0.075, 0.075, 0.44, 8),
    turret.glowMat, 0, 1.16, -0.44, 0, 0, Math.PI / 2
  );

  turret.muzzleHeight = 0.94;
  turret.muzzleForward = 1.62;
}
