// Modelo 3D simple de la torreta gunner.
// Exports: buildGunnerModel.

import * as THREE from 'three';

export function buildGunnerModel(turret) {
turret.addPart(new THREE.BoxGeometry(0.62, 0.42, 0.66), turret.bodyMat, 0, 0.62, 0);
turret.addPart(new THREE.BoxGeometry(0.42, 0.2, 0.3), turret.darkMat, 0, 0.92, -0.12);
turret.addPart(new THREE.CylinderGeometry(0.13, 0.15, 0.22, 6), turret.rustMat, 0, 0.9, -0.18);

// Cañón principal
turret.addPart(new THREE.BoxGeometry(0.13, 0.13, 0.95), turret.darkMat, 0, 0.9, -0.72);
turret.addPart(new THREE.BoxGeometry(0.08, 0.08, 0.86), turret.accentMat, 0, 0.9, -0.7);
turret.addPart(new THREE.BoxGeometry(0.22, 0.16, 0.3), turret.rustMat, 0, 0.9, -0.2);

// Piezas de mejora (ocultas)
turret.addHiddenPart(
  'twin_barrels',
  new THREE.BoxGeometry(0.11, 0.11, 0.9),
  turret.darkMat, 0.17, 0.9, -0.7
);
turret.addHiddenPart(
  'ammo_drum',
  new THREE.CylinderGeometry(0.2, 0.2, 0.18, 8),
  turret.rustMat, 0.3, 0.72, 0.05, 0, 0, Math.PI / 2
);
turret.addHiddenPart(
  'long_barrel',
  new THREE.BoxGeometry(0.1, 0.1, 1.5),
  turret.accentMat, 0, 0.9, -1.0
);
turret.addHiddenPart(
  'rail_coils',
  new THREE.TorusGeometry(0.16, 0.035, 5, 10),
  turret.glowMat, 0, 0.9, -1.05, Math.PI / 2, 0, 0
);
turret.addHiddenPart(
  'fuel_tank',
  new THREE.CylinderGeometry(0.16, 0.16, 0.5, 7),
  turret.rustMat, -0.3, 0.65, 0.08, 0, 0, Math.PI / 2
);
turret.addHiddenPart(
  'explosive_tank',
  new THREE.CylinderGeometry(0.18, 0.18, 0.42, 7),
  turret.accentMat, 0.3, 0.62, 0.1, 0, 0, Math.PI / 2
);

turret.muzzleHeight = 0.9;
turret.muzzleForward = 1.18;
}
