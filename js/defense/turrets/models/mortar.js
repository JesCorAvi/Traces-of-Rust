// Modelo 3D simple de la torreta mortar.
// Exports: buildMortarModel.

import * as THREE from 'three';

export function buildMortarModel(turret) {
turret.addPart(new THREE.BoxGeometry(0.8, 0.32, 0.72), turret.bodyMat, 0, 0.5, 0);
turret.addPart(new THREE.CylinderGeometry(0.26, 0.3, 0.22, 8), turret.rustMat, 0, 0.7, 0);
turret.addPart(
  new THREE.CylinderGeometry(0.15, 0.19, 1.05, 8),
  turret.darkMat, 0, 1.15, -0.16, -0.72, 0, 0
);
turret.addPart(
  new THREE.CylinderGeometry(0.19, 0.21, 0.16, 8),
  turret.accentMat, 0, 1.52, -0.48, -0.72, 0, 0
);
turret.addPart(new THREE.BoxGeometry(0.34, 0.16, 0.3), turret.rustMat, 0.34, 0.6, 0.1);

turret.addHiddenPart(
  'cluster_tubes',
  new THREE.CylinderGeometry(0.09, 0.11, 0.7, 6),
  turret.rustMat, -0.18, 1.08, -0.1, -0.72, 0, 0
);
turret.addHiddenPart(
  'autoloader',
  new THREE.CylinderGeometry(0.2, 0.2, 0.5, 8),
  turret.accentMat, 0.36, 0.78, -0.08, 0, 0, Math.PI / 2
);
turret.addHiddenPart(
  'fuel_tanks',
  new THREE.CylinderGeometry(0.14, 0.14, 0.6, 7),
  turret.rustMat, -0.36, 0.62, 0.12, 0, 0, Math.PI / 2
);
turret.addHiddenPart(
  'siege_barrel',
  new THREE.CylinderGeometry(0.22, 0.28, 1.25, 8),
  turret.accentMat, 0, 1.22, -0.2, -0.72, 0, 0
);
turret.addHiddenPart(
  'barrage_racks',
  new THREE.BoxGeometry(0.55, 0.18, 0.5),
  turret.rustMat, 0, 0.72, 0.25
);
turret.addHiddenPart(
  'inferno_tanks',
  new THREE.CylinderGeometry(0.17, 0.17, 0.7, 7),
  turret.accentMat, -0.4, 0.68, 0.16, 0, 0, Math.PI / 2
);

turret.muzzleHeight = 1.58;
turret.muzzleForward = 0.55;
}
