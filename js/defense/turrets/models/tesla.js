// Modelo 3D de la torreta Tesla: columna cerámica, bobinas de cobre y electrodos.
// Exports: buildTeslaModel.

import * as THREE from 'three';

export function buildTeslaModel(turret) {
  turret.addPart(new THREE.BoxGeometry(0.58, 0.34, 0.58), turret.bodyMat, 0, 0.58, 0);
  turret.addPart(new THREE.BoxGeometry(0.06, 0.32, 0.54), turret.panelMat, -0.31, 0.58, 0);
  turret.addPart(new THREE.BoxGeometry(0.06, 0.32, 0.54), turret.panelMat, 0.31, 0.58, 0);

  const decal = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.19), turret.decalMat);
  decal.position.set(-0.35, 0.58, 0.03);
  decal.rotation.y = -Math.PI / 2;
  turret.modelRoot.add(decal);

  const gauge = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), turret.gaugeMat);
  gauge.position.set(0, 0.6, 0.32);
  gauge.rotation.y = Math.PI;
  turret.modelRoot.add(gauge);

  // Columna aislante y bobinas de cobre.
  turret.addPart(new THREE.CylinderGeometry(0.15, 0.2, 0.86, 8), turret.darkMat, 0, 1.04, 0);
  for (let y = 0.82; y <= 1.38; y += 0.14) {
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 6, 16), turret.rustMat);
    coil.rotation.x = Math.PI / 2;
    coil.position.set(0, y, 0);
    turret.modelRoot.add(coil);
  }

  // Electrodo superior.
  turret.addPart(new THREE.IcosahedronGeometry(0.2, 0), turret.accentMat, 0, 1.62, 0);
  turret.addPart(new THREE.CylinderGeometry(0.045, 0.06, 0.34, 6), turret.darkMat, -0.3, 1.24, 0);
  turret.addPart(new THREE.CylinderGeometry(0.045, 0.06, 0.34, 6), turret.darkMat, 0.3, 1.24, 0);
  turret.addPart(new THREE.BoxGeometry(0.48, 0.06, 0.08), turret.glowMat, 0, 1.42, 0);

  turret.addHiddenPart(
    'tesla_arcs',
    new THREE.TorusGeometry(0.3, 0.045, 6, 18),
    turret.glowMat, 0, 1.48, 0, Math.PI / 2, 0, 0
  );
  turret.addHiddenPart(
    'tesla_crown',
    new THREE.ConeGeometry(0.08, 0.3, 6),
    turret.glowMat, -0.24, 1.82, 0, 0, 0, -0.4
  );
  turret.addHiddenPart(
    'tesla_capacitor',
    new THREE.CylinderGeometry(0.11, 0.11, 0.34, 8),
    turret.accentMat, 0.36, 0.72, 0.08, 0, 0, Math.PI / 2
  );
  turret.addHiddenPart(
    'tesla_overload',
    new THREE.TorusGeometry(0.42, 0.035, 6, 20),
    turret.glowMat, 0, 1.2, 0, Math.PI / 2, 0, 0
  );

  turret.muzzleHeight = 1.62;
  turret.muzzleForward = 0.2;
}
