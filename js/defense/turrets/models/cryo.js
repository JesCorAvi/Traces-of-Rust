// Modelo 3D simple de la torreta cryo.
// Exports: buildCryoModel.

import * as THREE from 'three';

export function buildCryoModel(turret) {
turret.addPart(new THREE.CylinderGeometry(0.4, 0.46, 0.55, 8), turret.bodyMat, 0, 0.62, 0);
turret.addPart(new THREE.CylinderGeometry(0.3, 0.34, 0.7, 8), turret.darkMat, 0, 1.1, 0);
turret.addPart(new THREE.CylinderGeometry(0.2, 0.24, 0.28, 8), turret.accentMat, 0, 1.5, 0);
turret.addPart(new THREE.BoxGeometry(0.14, 0.5, 0.14), turret.rustMat, -0.42, 0.9, 0);
turret.addPart(new THREE.BoxGeometry(0.14, 0.5, 0.14), turret.rustMat, 0.42, 0.9, 0);

turret.addHiddenPart(
  'frost_coils',
  new THREE.TorusGeometry(0.34, 0.045, 6, 12),
  turret.glowMat, 0, 1.16, 0, Math.PI / 2, 0, 0
);
turret.addHiddenPart(
  'radiator_fins',
  new THREE.BoxGeometry(0.72, 0.42, 0.08),
  turret.rustMat, 0, 1.05, 0.34
);
turret.addHiddenPart(
  'crystal_core',
  new THREE.IcosahedronGeometry(0.24, 0),
  turret.glowMat, 0, 1.55, 0
);
turret.addHiddenPart(
  'ice_spikes',
  new THREE.ConeGeometry(0.1, 0.5, 5),
  turret.glowMat, 0.34, 1.3, -0.12
);
turret.addHiddenPart(
  'shatter_crystal',
  new THREE.OctahedronGeometry(0.3, 0),
  turret.glowMat, 0, 1.7, 0
);
turret.addHiddenPart(
  'blizzard_core',
  new THREE.TorusGeometry(0.5, 0.06, 6, 16),
  turret.glowMat, 0, 1.2, 0, Math.PI / 2, 0, 0
);

turret.muzzleHeight = 1.5;
turret.muzzleForward = 0.2;
}
