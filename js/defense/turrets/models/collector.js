// Modelo 3D del recolector: contenedores de chatarra, grúa y baliza de suministros.
// Exports: buildCollectorModel.

import * as THREE from 'three';

export function buildCollectorModel(turret) {
  turret.addPart(new THREE.BoxGeometry(0.72, 0.32, 0.72), turret.bodyMat, 0, 0.58, 0);
  turret.addPart(new THREE.BoxGeometry(0.06, 0.28, 0.66), turret.panelMat, -0.38, 0.58, 0);
  turret.addPart(new THREE.BoxGeometry(0.06, 0.28, 0.66), turret.panelMat, 0.38, 0.58, 0);

  // Contenedor central con franjas de peligro.
  turret.addPart(new THREE.BoxGeometry(0.5, 0.34, 0.5), turret.darkMat, 0, 0.9, 0);
  turret.addPart(new THREE.BoxGeometry(0.52, 0.08, 0.52), turret.hazardMat, 0, 1.08, 0);

  // Chatarra visible en el contenedor.
  for (let i = 0; i < 5; i++) {
    turret.addPart(
      new THREE.BoxGeometry(0.12, 0.1, 0.16),
      i % 2 === 0 ? turret.rustMat : turret.accentMat,
      (Math.random() - 0.5) * 0.36, 1.16 + Math.random() * 0.12, (Math.random() - 0.5) * 0.36,
      0, Math.random() * Math.PI, 0
    );
  }

  const decal = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.19), turret.decalMat);
  decal.position.set(-0.4, 0.58, 0.02);
  decal.rotation.y = -Math.PI / 2;
  turret.modelRoot.add(decal);

  // Mástil de grúa y brazo giratorio.
  turret.addPart(new THREE.CylinderGeometry(0.07, 0.09, 0.9, 8), turret.rustMat, 0.32, 1.22, 0);
  const crane = new THREE.Group();
  crane.position.set(0.32, 1.66, 0);
  turret.modelRoot.add(crane);
  turret.radarDishMesh = crane;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.08), turret.accentMat);
  arm.position.set(-0.34, 0, 0);
  crane.add(arm);
  const claw = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 6), turret.glowMat);
  claw.rotation.z = Math.PI;
  claw.position.set(-0.68, -0.2, 0);
  crane.add(claw);

  // Baliza de suministros.
  turret.addPart(new THREE.CylinderGeometry(0.04, 0.06, 0.5, 6), turret.glowMat, -0.28, 1.28, 0.18);

  turret.addHiddenPart(
    'scrap_bin',
    new THREE.BoxGeometry(0.7, 0.28, 0.42),
    turret.hazardMat, 0, 0.5, -0.42
  );
  turret.addHiddenPart(
    'crane',
    new THREE.BoxGeometry(0.92, 0.06, 0.06),
    turret.glowMat, -0.28, 1.82, 0
  );
  turret.addHiddenPart(
    'beacon',
    new THREE.CylinderGeometry(0.09, 0.09, 0.16, 8),
    turret.accentMat, -0.28, 1.58, 0.18
  );

  turret.muzzleHeight = 1.3;
  turret.muzzleForward = 0.2;
}
