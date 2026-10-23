// Modelo 3D del Mortero de Arena, reconstruido como catapulta de bambú y coco.
// Exports: buildMortarModel.

import * as THREE from 'three';
import {
  addCoconut,
  addPalmLeaf,
  addBambooPole,
  addRopeBand,
  addEnergyRing,
  addShellDish
} from './parts.js';

export function buildMortarModel(turret) {
  // Bastidor triangular de bambú.
  addBambooPole(turret, -0.52, 0.44, 0.48, -0.28, 1.72, -0.1, 0.075);
  addBambooPole(turret, 0.52, 0.44, 0.48, 0.28, 1.72, -0.1, 0.075);
  addBambooPole(turret, -0.52, 0.44, -0.32, -0.28, 1.72, -0.1, 0.075);
  addBambooPole(turret, 0.52, 0.44, -0.32, 0.28, 1.72, -0.1, 0.075);
  turret.addPart(new THREE.CylinderGeometry(0.13, 0.17, 1.05, 6), turret.bambooDarkMat, 0, 1.1, 0.2, Math.PI / 2.6, 0, 0);
  addRopeBand(turret, 0, 1.33, 0.32, 0.18, { rx: Math.PI / 2 });

  // Cuna de arena y cojín de fibra.
  turret.addPart(new THREE.CylinderGeometry(0.33, 0.4, 0.16, 8), turret.sandbagMat, 0, 0.5, 0.02);

  // Núcleo de torsión: coco energizado y anillos.
  addCoconut(turret, 0, 0.84, 0.08, 0.18);
  addEnergyRing(turret, 0, 0.84, 0.08, 0.29, { rx: Math.PI / 2 });
  addEnergyRing(turret, 0, 0.84, 0.08, 0.22, { rz: Math.PI / 2 });

  // Brazo de lanzamiento y cesta de coco.
  const armGroup = new THREE.Group();
  armGroup.position.set(0, 1.08, 0.12);
  turret.modelRoot.add(armGroup);
  addBambooPole(turret, 0, 0, 0.22, 0, 0.54, -0.82, 0.075, {
    parent: armGroup, material: turret.bambooMat
  });
  addBambooPole(turret, -0.16, 0.02, 0.12, 0.16, 0.02, 0.12, 0.06, {
    parent: armGroup, material: turret.bambooDarkMat
  });
  addShellDish(turret, 0, 0.57, -0.72, {
    sx: 0.3, sy: 0.16, sz: 0.3, rx: -0.28, parent: armGroup
  });
  addCoconut(turret, 0, 0.61, -0.74, 0.19, { parent: armGroup });

  // Contrapeso de coral y cuerda de tensión.
  addCoconut(turret, 0, 0.1, 0.4, 0.14, { parent: armGroup });
  addRopeBand(turret, 0, 0.1, 0.4, 0.2, { rx: Math.PI / 2, parent: armGroup });
  addBambooPole(turret, -0.52, 0.44, 0.48, 0, 1.12, 0.34, 0.035, {
    material: turret.ropeMat
  });
  addBambooPole(turret, 0.52, 0.44, 0.48, 0, 1.12, 0.34, 0.035, {
    material: turret.ropeMat
  });

  // Hojas de palma como protectores del mecanismo.
  addPalmLeaf(turret, -0.52, 1.15, -0.12, {
    sx: 0.13, sy: 0.7, sz: 0.13, rx: 0.55, rz: -0.7
  });
  addPalmLeaf(turret, 0.5, 1.02, -0.08, {
    sx: 0.12, sy: 0.62, sz: 0.12, rx: 0.45, rz: 0.7, light: true
  });

  // Mejoras: racimo de cocos, autocargador, tanques de zumo, brazo de asedio,
  // rack de andanada y cocos incendiarios.
  turret.addHiddenPart(
    'cluster_tubes',
    new THREE.CylinderGeometry(0.1, 0.12, 0.7, 6),
    turret.coconutFleshMat, -0.3, 1.55, -0.25, -0.55, 0, 0
  );
  turret.addHiddenPart(
    'autoloader',
    new THREE.CylinderGeometry(0.22, 0.22, 0.52, 10),
    turret.coconutMat, 0.42, 1.08, -0.12, 0, 0, Math.PI / 2
  );
  turret.addHiddenPart(
    'fuel_tanks',
    new THREE.CylinderGeometry(0.16, 0.16, 0.62, 8),
    turret.accentMat, -0.42, 0.88, 0.22, 0, 0, Math.PI / 2
  );
  turret.addHiddenPart(
    'siege_barrel',
    new THREE.CylinderGeometry(0.25, 0.31, 1.4, 10),
    turret.bambooMat, 0, 1.55, -0.55, -0.62, 0, 0
  );
  turret.addHiddenPart(
    'barrage_racks',
    new THREE.BoxGeometry(0.56, 0.18, 0.5),
    turret.bambooDarkMat, 0, 0.74, 0.42
  );
  turret.addHiddenPart(
    'inferno_tanks',
    new THREE.SphereGeometry(0.18, 8, 6),
    turret.glowMat, 0.42, 0.76, 0.18
  );

  turret.muzzleHeight = 1.66;
  turret.muzzleForward = 0.7;
}
