// Modelo 3D simple de la torreta support.
// Exports: buildSupportModel.

import * as THREE from 'three';

export function buildSupportModel(turret) {
turret.addPart(new THREE.BoxGeometry(0.72, 0.34, 0.72), turret.bodyMat, 0, 0.5, 0);
turret.addPart(new THREE.CylinderGeometry(0.11, 0.14, 0.9, 6), turret.rustMat, 0, 1.05, 0);
turret.addPart(new THREE.BoxGeometry(0.42, 0.09, 0.09), turret.accentMat, 0, 1.3, 0);
turret.addPart(new THREE.BoxGeometry(0.09, 0.42, 0.09), turret.accentMat, 0, 1.3, 0);
turret.addPart(new THREE.BoxGeometry(0.26, 0.14, 0.26), turret.darkMat, 0, 0.72, 0.28);

turret.addHiddenPart(
  'tool_arms',
  new THREE.BoxGeometry(0.5, 0.1, 0.1),
  turret.rustMat, 0.34, 0.95, -0.18, 0, 0, -0.35
);
turret.addHiddenPart(
  'tesla_coils',
  new THREE.TorusGeometry(0.22, 0.04, 5, 12),
  turret.glowMat, 0, 1.45, 0, Math.PI / 2, 0, 0
);
turret.addHiddenPart(
  'surge_core',
  new THREE.IcosahedronGeometry(0.2, 0),
  turret.glowMat, 0, 1.6, 0
);
const dome = turret.addHiddenPart(
  'dome',
  new THREE.SphereGeometry(0.62, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
  new THREE.MeshBasicMaterial({
    color: 0x6f8f9c, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false
  }),
  0, 0.34, 0
);
dome.castShadow = false;
dome.receiveShadow = false;
turret.addHiddenPart(
  'barrier_ring',
  new THREE.TorusGeometry(0.72, 0.045, 6, 20),
  turret.glowMat, 0, 0.6, 0, Math.PI / 2, 0, 0
);
turret.addHiddenPart(
  'repair_beacon',
  new THREE.CylinderGeometry(0.06, 0.08, 0.55, 6),
  turret.glowMat, 0, 1.72, 0
);

turret.muzzleHeight = 1.35;
turret.muzzleForward = 0.2;
}
