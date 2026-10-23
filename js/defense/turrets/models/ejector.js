// Modelo 3D del Ventilador de Palma: turbina de hojas y veleta de bambú.
// Exports: buildEjectorModel.

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

export function buildEjectorModel(turret) {
  turret.addPart(new THREE.CylinderGeometry(0.34, 0.44, 0.28, 8), turret.bambooDarkMat, 0, 0.58, 0);
  turret.addPart(new THREE.CylinderGeometry(0.22, 0.28, 0.65, 8), turret.bambooMat, 0, 0.94, 0.12);
  addRopeBand(turret, 0, 0.72, 0.12, 0.25, { rx: Math.PI / 2 });

  // Mástil y horquilla de la turbina.
  addBambooPole(turret, 0, 0.75, -0.05, 0, 1.28, -0.22, 0.055);
  addBambooPole(turret, -0.26, 1.22, -0.18, 0.26, 1.22, -0.18, 0.05);
  addCoconut(turret, 0, 1.28, -0.2, 0.16);

  // Aspas de palma que giran.
  const fanGroup = new THREE.Group();
  fanGroup.position.set(0, 1.24, -0.3);
  turret.modelRoot.add(fanGroup);
  turret.spinnerMesh = fanGroup;
  turret.spinnerSpeed = 3.4;

  const bladeGeo = new THREE.PlaneGeometry(0.23, 0.76);
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const blade = new THREE.Mesh(bladeGeo, i % 2 === 0 ? turret.leafMat : turret.leafLightMat);
    blade.position.set(Math.sin(angle) * 0.34, Math.cos(angle) * 0.34, 0);
    blade.rotation.z = -angle;
    blade.castShadow = true;
    fanGroup.add(blade);
    const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.72, 5), turret.bambooMat);
    rib.position.set(Math.sin(angle) * 0.34, Math.cos(angle) * 0.34, 0.01);
    rib.rotation.z = -angle;
    fanGroup.add(rib);
  }
  addRopeBand(turret, 0, 0, 0, 0.2, { parent: fanGroup, rx: Math.PI / 2 });
  addGlowPearl(turret, 0, 0, 0.08, 0.09, { parent: fanGroup });
  addEnergyRing(turret, 0, 0, -0.02, 0.48, { parent: fanGroup, rx: Math.PI / 2 });

  // Recolector de viento trasero y refuerzos.
  addShellDish(turret, 0, 1.22, 0.24, {
    sx: 0.38, sy: 0.18, sz: 0.34, rx: 0.4
  });
  addPalmLeaf(turret, -0.46, 1.0, 0.1, {
    sx: 0.1, sy: 0.58, sz: 0.1, rx: 0.8, rz: -0.85
  });
  addPalmLeaf(turret, 0.46, 1.0, 0.1, {
    sx: 0.09, sy: 0.52, sz: 0.09, rx: 0.8, rz: 0.85, light: true
  });

  // Mejoras: tanque de presión, boquilla ancha y anillo de reflujo.
  turret.addHiddenPart(
    'pressure_tank',
    new THREE.CylinderGeometry(0.18, 0.18, 0.5, 8),
    turret.coconutMat, 0.38, 0.8, 0.06, 0, 0, Math.PI / 2
  );
  turret.addHiddenPart(
    'wide_nozzle',
    new THREE.CylinderGeometry(0.44, 0.18, 0.28, 12, 1, true),
    turret.coconutFleshMat, 0, 1.24, -0.78, Math.PI / 2, 0, 0
  );
  turret.addHiddenPart(
    'reflux_pipes',
    new THREE.TorusGeometry(0.24, 0.04, 6, 16),
    turret.glowMat, 0, 1.08, -0.12, Math.PI / 2, 0, 0
  );

  turret.muzzleHeight = 1.24;
  turret.muzzleForward = 0.85;
}
