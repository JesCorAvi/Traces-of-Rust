// Modelo 3D del cañón de riel: raíles largos, capacitores y óptica de precisión.
// Exports: buildRailgunModel.

import * as THREE from 'three';

export function buildRailgunModel(turret) {
  turret.addPart(new THREE.BoxGeometry(0.62, 0.34, 0.7), turret.bodyMat, 0, 0.6, 0);
  turret.addPart(new THREE.BoxGeometry(0.06, 0.3, 0.64), turret.panelMat, -0.33, 0.6, 0);
  turret.addPart(new THREE.BoxGeometry(0.06, 0.3, 0.64), turret.panelMat, 0.33, 0.6, 0);

  const decal = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.19), turret.decalMat);
  decal.position.set(-0.35, 0.62, 0.05);
  decal.rotation.y = -Math.PI / 2;
  turret.modelRoot.add(decal);

  const gauge = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), turret.gaugeMat);
  gauge.position.set(0, 0.62, 0.37);
  gauge.rotation.y = Math.PI;
  turret.modelRoot.add(gauge);

  // Bancos de capacitores.
  for (const side of [-1, 1]) {
    turret.addPart(
      new THREE.CylinderGeometry(0.1, 0.1, 0.34, 8),
      turret.accentMat, side * 0.28, 0.9, 0.18
    );
  }

  const railGroup = new THREE.Group();
  railGroup.position.set(0, 0.8, 0);
  turret.modelRoot.add(railGroup);
  turret.barrelRecoilMesh = railGroup;
  turret.barrelBaseZ = 0;

  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.11, 1.55),
      turret.darkMat
    );
    rail.position.set(side * 0.12, 0, -0.82);
    railGroup.add(rail);
  }
  const brace = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.08, 0.18),
    turret.rustMat
  );
  brace.position.set(0, 0, -1.54);
  railGroup.add(brace);

  for (let i = 0; i < 3; i++) {
    const coil = new THREE.Mesh(
      new THREE.TorusGeometry(0.19, 0.035, 6, 14),
      turret.glowMat
    );
    coil.position.set(0, 0, -0.45 - i * 0.34);
    railGroup.add(coil);
  }

  const scope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.34, 8),
    turret.accentMat
  );
  scope.rotation.x = Math.PI / 2;
  scope.position.set(0, 0.2, -0.52);
  railGroup.add(scope);

  turret.addHiddenPart(
    'long_rail',
    new THREE.BoxGeometry(0.07, 0.07, 1.9),
    turret.accentMat, 0, 0.8, -1.1
  );
  turret.addHiddenPart(
    'coil_bank',
    new THREE.TorusGeometry(0.24, 0.04, 6, 16),
    turret.glowMat, 0, 0.8, -1.32, Math.PI / 2, 0, 0
  );
  turret.addHiddenPart(
    'scope',
    new THREE.CylinderGeometry(0.08, 0.08, 0.46, 8),
    turret.glowMat, 0, 1.05, -0.3, 0, 0, Math.PI / 2
  );

  turret.muzzleHeight = 0.8;
  turret.muzzleForward = 1.62;
}
