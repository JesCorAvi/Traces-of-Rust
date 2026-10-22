// Modelo 3D de la Prensa de Vía: bastidor hidráulico y ariete de impacto.
// Exports: buildPressModel.

import * as THREE from 'three';

export function buildPressModel(turret) {
  turret.addPart(new THREE.BoxGeometry(0.66, 0.28, 0.58), turret.bodyMat, 0, 0.56, 0);
  turret.addPart(new THREE.BoxGeometry(0.06, 0.24, 0.52), turret.panelMat, -0.35, 0.56, 0);
  turret.addPart(new THREE.BoxGeometry(0.06, 0.24, 0.52), turret.panelMat, 0.35, 0.56, 0);

  // Bastidor vertical.
  for (const side of [-1, 1]) {
    turret.addPart(new THREE.BoxGeometry(0.12, 0.86, 0.16), turret.darkMat, side * 0.28, 1.02, 0);
    turret.addPart(new THREE.CylinderGeometry(0.07, 0.07, 0.6, 8), turret.rustMat, side * 0.28, 0.86, 0.14);
  }
  turret.addPart(new THREE.BoxGeometry(0.72, 0.14, 0.22), turret.bodyMat, 0, 1.46, 0);

  // Ariete central.
  turret.addPart(new THREE.BoxGeometry(0.22, 0.66, 0.22), turret.rustMat, 0, 1.04, 0);
  turret.addPart(new THREE.BoxGeometry(0.5, 0.16, 0.5), turret.hazardMat, 0, 0.66, 0);

  const decal = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.18), turret.decalMat);
  decal.position.set(-0.38, 0.58, 0.02);
  decal.rotation.y = -Math.PI / 2;
  turret.modelRoot.add(decal);

  const gauge = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), turret.gaugeMat);
  gauge.position.set(0, 1.3, 0.2);
  gauge.rotation.y = Math.PI;
  turret.modelRoot.add(gauge);

  turret.addHiddenPart(
    'heavy_ram',
    new THREE.BoxGeometry(0.66, 0.18, 0.62),
    turret.accentMat, 0, 0.52, 0
  );
  turret.addHiddenPart(
    'side_pistons',
    new THREE.CylinderGeometry(0.08, 0.08, 0.64, 8),
    turret.glowMat, -0.36, 1.04, 0
  );
  turret.addHiddenPart(
    'hazard_plate',
    new THREE.BoxGeometry(0.62, 0.08, 0.54),
    turret.hazardMat, 0, 1.52, 0
  );

  turret.muzzleHeight = 0.7;
  turret.muzzleForward = 0.25;
}
