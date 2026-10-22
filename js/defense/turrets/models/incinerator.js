// Modelo 3D del Incinerator: depósitos de combustible, bomba y boquilla de fuego.
// Exports: buildIncineratorModel.

import * as THREE from 'three';

export function buildIncineratorModel(turret) {
  turret.addPart(new THREE.BoxGeometry(0.62, 0.36, 0.62), turret.bodyMat, 0, 0.6, 0);
  turret.addPart(new THREE.BoxGeometry(0.06, 0.32, 0.58), turret.panelMat, -0.33, 0.6, 0);
  turret.addPart(new THREE.BoxGeometry(0.06, 0.32, 0.58), turret.panelMat, 0.33, 0.6, 0);

  // Depósitos laterales.
  for (const side of [-1, 1]) {
    turret.addPart(
      new THREE.CylinderGeometry(0.16, 0.16, 0.56, 8),
      turret.rustMat, side * 0.42, 0.58, 0.06, 0, 0, Math.PI / 2
    );
    turret.addPart(
      new THREE.CylinderGeometry(0.17, 0.17, 0.08, 8),
      turret.hazardMat, side * 0.65, 0.58, 0.06, 0, 0, Math.PI / 2
    );
  }

  const decal = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.19), turret.decalMat);
  decal.position.set(-0.35, 0.62, 0.05);
  decal.rotation.y = -Math.PI / 2;
  turret.modelRoot.add(decal);

  const gauge = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), turret.gaugeMat);
  gauge.position.set(0, 0.62, 0.34);
  gauge.rotation.y = Math.PI;
  turret.modelRoot.add(gauge);

  // Grupo de boquilla con retroceso.
  const nozzleGroup = new THREE.Group();
  nozzleGroup.position.set(0, 0.78, 0);
  turret.modelRoot.add(nozzleGroup);
  turret.barrelRecoilMesh = nozzleGroup;
  turret.barrelBaseZ = 0;

  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.14, 0.72, 8),
    turret.darkMat
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0, -0.58);
  nozzleGroup.add(barrel);

  const nozzle = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.32, 8, 1, true),
    turret.rustMat
  );
  nozzle.rotation.x = -Math.PI / 2;
  nozzle.position.set(0, 0, -1.02);
  nozzleGroup.add(nozzle);

  const pilot = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 8, 6),
    turret.glowMat
  );
  pilot.position.set(0, 0.02, -1.2);
  nozzleGroup.add(pilot);

  turret.addHiddenPart(
    'fuel_tank',
    new THREE.CylinderGeometry(0.2, 0.2, 0.48, 8),
    turret.rustMat, 0.42, 0.66, -0.28, 0, 0, Math.PI / 2
  );
  turret.addHiddenPart(
    'pressure_valve',
    new THREE.TorusGeometry(0.14, 0.04, 6, 12),
    turret.accentMat, -0.28, 0.82, -0.2
  );
  turret.addHiddenPart(
    'napalm_tank',
    new THREE.CylinderGeometry(0.18, 0.18, 0.5, 8),
    turret.accentMat, 0, 0.92, 0.22, 0, 0, Math.PI / 2
  );

  turret.muzzleHeight = 0.78;
  turret.muzzleForward = 1.22;
}
