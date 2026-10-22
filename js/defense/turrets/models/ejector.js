// Modelo 3D de la Eyección Hidráulica: acumuladores, válvulas y boquilla de presión.
// Exports: buildEjectorModel.

import * as THREE from 'three';

export function buildEjectorModel(turret) {
  turret.addPart(new THREE.BoxGeometry(0.6, 0.3, 0.6), turret.bodyMat, 0, 0.56, 0);
  turret.addPart(new THREE.BoxGeometry(0.06, 0.26, 0.54), turret.panelMat, -0.33, 0.56, 0);
  turret.addPart(new THREE.BoxGeometry(0.06, 0.26, 0.54), turret.panelMat, 0.33, 0.56, 0);

  // Acumuladores laterales.
  for (const side of [-1, 1]) {
    turret.addPart(
      new THREE.CylinderGeometry(0.14, 0.14, 0.44, 8),
      turret.rustMat, side * 0.38, 0.7, 0.04
    );
    turret.addPart(
      new THREE.CylinderGeometry(0.15, 0.15, 0.07, 8),
      turret.hazardMat, side * 0.38, 0.94, 0.04
    );
  }

  const decal = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.18), turret.decalMat);
  decal.position.set(-0.35, 0.58, 0.05);
  decal.rotation.y = -Math.PI / 2;
  turret.modelRoot.add(decal);

  const nozzleGroup = new THREE.Group();
  nozzleGroup.position.set(0, 0.74, 0);
  turret.modelRoot.add(nozzleGroup);
  turret.barrelRecoilMesh = nozzleGroup;
  turret.barrelBaseZ = 0;

  const pipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.13, 0.46, 8),
    turret.darkMat
  );
  pipe.rotation.x = Math.PI / 2;
  pipe.position.set(0, 0, -0.36);
  nozzleGroup.add(pipe);

  const bell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.12, 0.26, 10, 1, true),
    turret.rustMat
  );
  bell.rotation.x = Math.PI / 2;
  bell.position.set(0, 0, -0.68);
  nozzleGroup.add(bell);

  turret.addPart(new THREE.TorusGeometry(0.14, 0.04, 6, 12), turret.glowMat, 0, 1.06, 0.16);

  turret.addHiddenPart(
    'pressure_tank',
    new THREE.CylinderGeometry(0.18, 0.18, 0.52, 8),
    turret.accentMat, 0.36, 0.82, -0.22, 0, 0, Math.PI / 2
  );
  turret.addHiddenPart(
    'wide_nozzle',
    new THREE.CylinderGeometry(0.42, 0.18, 0.3, 12, 1, true),
    turret.glowMat, 0, 0.74, -0.82, Math.PI / 2, 0, 0
  );
  turret.addHiddenPart(
    'reflux_pipes',
    new THREE.TorusGeometry(0.22, 0.04, 6, 16),
    turret.accentMat, 0, 0.98, 0, Math.PI / 2, 0, 0
  );

  turret.muzzleHeight = 0.74;
  turret.muzzleForward = 0.9;
}
