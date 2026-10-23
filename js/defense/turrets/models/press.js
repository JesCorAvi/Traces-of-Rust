// Modelo 3D del Pisotón de Coco: prensa de bambú con mazo de coco suspendido.
// Exports: buildPressModel.

import * as THREE from 'three';
import {
  addCoconut,
  addPalmLeaf,
  addBambooPole,
  addRopeBand,
  addEnergyRing,
  addShellDish
} from './parts.js';

export function buildPressModel(turret) {
  // Base y yunque de arena/coco.
  turret.addPart(new THREE.CylinderGeometry(0.42, 0.52, 0.22, 8), turret.bambooDarkMat, 0, 0.58, 0);
  turret.addPart(new THREE.CylinderGeometry(0.5, 0.58, 0.12, 10), turret.sandbagMat, 0, 0.75, 0);
  addShellDish(turret, 0, 0.82, 0, {
    sx: 0.45, sy: 0.12, sz: 0.45, rx: Math.PI
  });
  addEnergyRing(turret, 0, 0.83, 0, 0.28, { rx: Math.PI / 2 });

  // Bastidor A de bambú.
  for (const side of [-1, 1]) {
    addBambooPole(turret, side * 0.42, 0.68, 0.28, side * 0.3, 1.69, 0.02, 0.075);
    addBambooPole(turret, side * 0.42, 0.68, -0.28, side * 0.3, 1.69, 0.02, 0.075);
    addBambooPole(turret, side * 0.38, 0.8, 0.08, side * 0.38, 1.34, 0.08, 0.045, {
      material: turret.bambooDarkMat
    });
  }
  addBambooPole(turret, -0.32, 1.68, 0.02, 0.32, 1.68, 0.02, 0.075);

  // Mazo de coco suspendido por cuerdas.
  addCoconut(turret, 0, 1.22, 0.02, 0.3);
  addRopeBand(turret, 0, 1.22, 0.02, 0.4, { rx: Math.PI / 2 });
  addBambooPole(turret, -0.23, 1.68, 0.02, -0.12, 1.42, 0.02, 0.018, {
    material: turret.ropeMat
  });
  addBambooPole(turret, 0.23, 1.68, 0.02, 0.12, 1.42, 0.02, 0.018, {
    material: turret.ropeMat
  });
  addEnergyRing(turret, 0, 1.16, 0.02, 0.34, { rx: Math.PI / 2 });

  // Hojas y contrapeso trasero.
  addCoconut(turret, 0.4, 0.9, 0.34, 0.14);
  addPalmLeaf(turret, -0.5, 1.34, 0.08, {
    sx: 0.1, sy: 0.55, sz: 0.1, rx: 0.65, rz: -0.7
  });
  addPalmLeaf(turret, 0.5, 1.28, 0.12, {
    sx: 0.09, sy: 0.5, sz: 0.09, rx: 0.5, rz: 0.7, light: true
  });

  // Mejoras: mazo pesado, pistones laterales y placa de impacto.
  turret.addHiddenPart(
    'heavy_ram',
    new THREE.CylinderGeometry(0.4, 0.46, 0.24, 10),
    turret.coconutMat, 0, 0.55, 0
  );
  turret.addHiddenPart(
    'side_pistons',
    new THREE.CylinderGeometry(0.075, 0.075, 0.62, 8),
    turret.glowMat, -0.34, 1.2, 0.02
  );
  turret.addHiddenPart(
    'hazard_plate',
    new THREE.BoxGeometry(0.6, 0.08, 0.52),
    turret.glowMat, 0, 1.5, 0.02
  );

  turret.muzzleHeight = 0.78;
  turret.muzzleForward = 0.25;
}
