// Modelo 3D simple de la torreta barracks.
// Exports: buildBarracksModel.

import * as THREE from 'three';

export function buildBarracksModel(turret) {
turret.addPart(new THREE.BoxGeometry(0.95, 0.5, 0.85), turret.bodyMat, 0, 0.58, 0);
turret.addPart(new THREE.BoxGeometry(0.7, 0.28, 0.6), turret.darkMat, 0, 0.94, 0);
turret.addPart(new THREE.BoxGeometry(0.4, 0.18, 0.44), turret.rustMat, 0, 1.04, 0.12);
turret.addPart(new THREE.BoxGeometry(0.08, 1.05, 0.08), turret.rustMat, 0.38, 1.35, 0.2);
turret.addPart(new THREE.BoxGeometry(0.38, 0.2, 0.04), turret.accentMat, 0.55, 1.72, 0.2);
turret.addPart(new THREE.BoxGeometry(0.62, 0.12, 0.3), turret.darkMat, 0, 0.37, 0.34);

turret.addHiddenPart(
  'extra_bunks',
  new THREE.BoxGeometry(0.75, 0.16, 0.22),
  turret.rustMat, 0, 0.42, -0.34
);
turret.addHiddenPart(
  'battalion_bunks',
  new THREE.BoxGeometry(0.85, 0.24, 0.26),
  turret.accentMat, 0, 0.38, -0.36
);
turret.addHiddenPart(
  'armor_plates',
  new THREE.BoxGeometry(1.0, 0.16, 0.9),
  turret.rustMat, 0, 0.84, 0
);
turret.addHiddenPart(
  'heavy_armor',
  new THREE.BoxGeometry(1.08, 0.26, 0.98),
  turret.bodyMat, 0, 0.9, 0
);
turret.addHiddenPart(
  'antenna',
  new THREE.BoxGeometry(0.06, 0.75, 0.06),
  turret.accentMat, -0.34, 1.4, -0.16
);
turret.addHiddenPart(
  'drone_rack',
  new THREE.BoxGeometry(0.42, 0.14, 0.32),
  turret.accentMat, -0.3, 1.08, -0.2
);

turret.muzzleHeight = 1.2;
turret.muzzleForward = 0.4;
}
