// Modelo 3D del Tótem Tiki: tótem tallado con antena de concha y energía solar.
// Exports: buildSupportModel.

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

export function buildSupportModel(turret) {
  // Cuerpo del tótem y tallas.
  turret.addPart(new THREE.CylinderGeometry(0.3, 0.4, 0.34, 8), turret.bambooDarkMat, 0, 0.6, 0);
  turret.addPart(new THREE.CylinderGeometry(0.2, 0.28, 0.95, 6), turret.bambooMat, 0, 1.0, 0);
  addRopeBand(turret, 0, 0.74, 0, 0.24, { rx: Math.PI / 2 });
  addRopeBand(turret, 0, 1.16, 0, 0.2, { rx: Math.PI / 2 });

  // Máscara tiki con ojos de energía.
  turret.addPart(new THREE.BoxGeometry(0.48, 0.34, 0.22), turret.bambooDarkMat, 0, 1.34, -0.16);
  turret.addPart(new THREE.BoxGeometry(0.4, 0.1, 0.05), turret.coconutFleshMat, 0, 1.39, -0.28);
  addGlowPearl(turret, -0.12, 1.35, -0.29, 0.045);
  addGlowPearl(turret, 0.12, 1.35, -0.29, 0.045);
  for (let i = -1; i <= 1; i++) {
    turret.addPart(new THREE.BoxGeometry(0.055, 0.08, 0.04), turret.coconutMat, i * 0.12, 1.22, -0.29);
  }

  // Brazos de bambú con farolillos de coco.
  addBambooPole(turret, -0.22, 1.08, 0, -0.58, 1.3, 0.02, 0.045);
  addBambooPole(turret, 0.22, 1.08, 0, 0.58, 1.3, 0.02, 0.045);
  addCoconut(turret, -0.6, 1.24, 0.02, 0.105);
  addCoconut(turret, 0.6, 1.24, 0.02, 0.105);

  // Antena de concha giratoria.
  const radarGroup = new THREE.Group();
  radarGroup.position.set(0, 1.7, 0);
  turret.modelRoot.add(radarGroup);
  turret.radarDishMesh = radarGroup;
  addShellDish(turret, 0, 0.06, -0.05, {
    sx: 0.42, sy: 0.2, sz: 0.42, rx: -0.48, parent: radarGroup
  });
  addGlowPearl(turret, 0, 0.18, -0.22, 0.075, { parent: radarGroup });
  addPalmLeaf(turret, 0.06, 0.28, -0.08, {
    sx: 0.08, sy: 0.48, sz: 0.08, rx: -0.25, rz: 0.7, light: true, parent: radarGroup
  });
  addEnergyRing(turret, 0, 0.86, 0, 0.36, { rx: Math.PI / 2 });

  // Corona de hojas y tallado central.
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    addPalmLeaf(turret, Math.cos(a) * 0.22, 1.52, Math.sin(a) * 0.18, {
      sx: 0.07, sy: 0.42, sz: 0.07, rx: 0.4, rz: Math.cos(a) * 0.7,
      light: i % 2 === 0
    });
  }
  turret.addPart(new THREE.CylinderGeometry(0.055, 0.075, 0.34, 6), turret.ropeMat, 0, 1.58, 0.02);

  // Mejoras: brazos herramienta, bobinas, núcleo de sobrecarga, cúpula de
  // coraza, anillo de barrera y baliza de reparación.
  turret.addHiddenPart(
    'tool_arms',
    new THREE.BoxGeometry(0.52, 0.1, 0.1),
    turret.bambooMat, 0.36, 1.08, -0.18, 0, 0, -0.35
  );
  turret.addHiddenPart(
    'tesla_coils',
    new THREE.TorusGeometry(0.28, 0.04, 6, 16),
    turret.glowMat, 0, 1.46, 0, Math.PI / 2, 0, 0
  );
  turret.addHiddenPart(
    'surge_core',
    new THREE.IcosahedronGeometry(0.2, 0),
    turret.crystalMat, 0, 1.16, 0
  );
  turret.addHiddenPart(
    'dome',
    new THREE.SphereGeometry(0.7, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    turret.crystalMat, 0, 0.5, 0
  );
  turret.addHiddenPart(
    'barrier_ring',
    new THREE.TorusGeometry(0.8, 0.045, 6, 24),
    turret.glowMat, 0, 0.58, 0, Math.PI / 2, 0, 0
  );
  turret.addHiddenPart(
    'repair_beacon',
    new THREE.CylinderGeometry(0.055, 0.07, 0.55, 8),
    turret.glowMat, 0, 1.94, 0
  );

  turret.muzzleHeight = 1.68;
  turret.muzzleForward = 0.25;
}
