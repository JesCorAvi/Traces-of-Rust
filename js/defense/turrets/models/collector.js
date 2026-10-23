// Modelo 3D del Recolector de Cocos: cesta de mimbre, palmera y grúa de recogida.
// Exports: buildCollectorModel.

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

export function buildCollectorModel(turret) {
  // Cesta/nevera de mimbre con cocos.
  turret.addPart(new THREE.CylinderGeometry(0.48, 0.58, 0.34, 10), turret.bambooDarkMat, 0, 0.64, 0);
  addShellDish(turret, 0, 0.84, 0, {
    sx: 0.52, sy: 0.3, sz: 0.52, rx: Math.PI
  });
  const coconutPositions = [[-0.22, 0.84, -0.08], [0.18, 0.86, 0.04], [0.02, 0.9, 0.22], [-0.16, 0.88, 0.2]];
  for (const [x, y, z] of coconutPositions) {
    addCoconut(turret, x, y, z, 0.11, { glow: false });
  }
  addRopeBand(turret, 0, 0.68, 0, 0.5, { rx: Math.PI / 2 });

  // Palmera pequeña de soporte y contrapeso.
  addBambooPole(turret, 0.4, 0.6, 0.18, 0.38, 1.5, 0.12, 0.06, {
    material: turret.bambooDarkMat
  });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.3;
    addPalmLeaf(turret, 0.38 + Math.cos(a) * 0.08, 1.5, 0.12 + Math.sin(a) * 0.08, {
      sx: 0.08, sy: 0.5, sz: 0.08, rx: 0.4, rz: Math.cos(a) * 0.8,
      light: i % 2 === 0
    });
  }

  // Grúa giratoria de recogida.
  const crane = new THREE.Group();
  crane.position.set(0.38, 1.58, 0.12);
  turret.modelRoot.add(crane);
  turret.radarDishMesh = crane;
  addBambooPole(turret, 0, 0, 0, -0.68, 0.16, 0, 0.04, {
    parent: crane, material: turret.bambooMat
  });
  addBambooPole(turret, -0.68, 0.16, 0, -0.68, -0.12, 0, 0.018, {
    parent: crane, material: turret.ropeMat
  });
  addCoconut(turret, -0.68, -0.24, 0, 0.11, { parent: crane });
  addEnergyRing(turret, 0, 0.12, 0, 0.2, { parent: crane, rx: Math.PI / 2 });

  // Baliza de suministros.
  addBambooPole(turret, -0.4, 0.6, 0.28, -0.4, 1.25, 0.28, 0.025);
  addGlowPearl(turret, -0.4, 1.3, 0.28, 0.1);
  addEnergyRing(turret, -0.4, 1.3, 0.28, 0.18, { rx: Math.PI / 2 });

  // Mejoras: cesta extra, grúa reforzada y baliza.
  turret.addHiddenPart(
    'scrap_bin',
    new THREE.BoxGeometry(0.7, 0.26, 0.4),
    turret.bambooMat, 0, 0.52, -0.42
  );
  turret.addHiddenPart(
    'crane',
    new THREE.BoxGeometry(0.9, 0.055, 0.055),
    turret.coconutFleshMat, -0.2, 1.84, 0.12
  );
  turret.addHiddenPart(
    'beacon',
    new THREE.CylinderGeometry(0.08, 0.08, 0.14, 8),
    turret.accentMat, -0.4, 1.48, 0.28
  );

  turret.muzzleHeight = 1.3;
  turret.muzzleForward = 0.25;
}
