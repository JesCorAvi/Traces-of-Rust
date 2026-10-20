// Modelo 3D de la torreta barracks: búnker hexagonal blindado con compuerta de despliegue y calcomanías.
// Exports: buildBarracksModel.

import * as THREE from 'three';

export function buildBarracksModel(turret) {
  // Bunker hexagonal blindado
  turret.addPart(new THREE.CylinderGeometry(0.72, 0.82, 0.56, 6), turret.bodyMat, 0, 0.62, 0);

  // Placas de blindaje remachadas en los flancos con textura técnica
  turret.addPart(new THREE.BoxGeometry(0.06, 0.44, 0.58), turret.panelMat, -0.72, 0.62, 0);
  turret.addPart(new THREE.BoxGeometry(0.06, 0.44, 0.58), turret.panelMat, 0.72, 0.62, 0);

  // Placa de stencil militar en el lateral
  const decalMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.21), turret.decalMat);
  decalMesh.position.set(-0.76, 0.65, 0);
  decalMesh.rotation.y = -Math.PI / 2;
  turret.modelRoot.add(decalMesh);

  // Compuerta frontal hidráulica de despliegue
  turret.addPart(new THREE.BoxGeometry(0.48, 0.38, 0.08), turret.darkMat, 0, 0.52, -0.68);
  turret.addPart(new THREE.BoxGeometry(0.44, 0.06, 0.09), turret.hazardMat, 0, 0.69, -0.68); // dintel de advertencia
  turret.addPart(new THREE.BoxGeometry(0.44, 0.06, 0.09), turret.hazardMat, 0, 0.35, -0.68); // umbral de advertencia

  // Hendidura de observación blindada con cristal ámbar
  turret.addPart(new THREE.BoxGeometry(0.36, 0.08, 0.1), turret.accentMat, 0, 0.82, -0.45);

  // Cúpula superior del búnker
  turret.addPart(new THREE.CylinderGeometry(0.48, 0.65, 0.24, 6), turret.darkMat, 0, 0.98, 0);

  // Mástil de comunicaciones en el techo con baliza verde
  turret.addPart(new THREE.CylinderGeometry(0.03, 0.04, 0.85, 6), turret.rustMat, 0.32, 1.48, 0.15);
  turret.addPart(new THREE.SphereGeometry(0.07, 6, 6), turret.glowMat, 0.32, 1.92, 0.15); // luz de estado

  // Piezas de mejora (ocultas)
  turret.addHiddenPart(
    'extra_bunks',
    new THREE.BoxGeometry(0.82, 0.22, 0.28),
    turret.rustMat, 0, 0.48, 0.55
  );
  turret.addHiddenPart(
    'battalion_bunks',
    new THREE.BoxGeometry(0.92, 0.32, 0.32),
    turret.accentMat, 0, 0.45, 0.58
  );
  turret.addHiddenPart(
    'armor_plates',
    new THREE.CylinderGeometry(0.85, 0.95, 0.22, 6),
    turret.rustMat, 0, 0.85, 0
  );
  turret.addHiddenPart(
    'heavy_armor',
    new THREE.CylinderGeometry(0.95, 1.05, 0.32, 6),
    turret.bodyMat, 0, 0.9, 0
  );
  turret.addHiddenPart(
    'antenna',
    new THREE.CylinderGeometry(0.025, 0.035, 1.25, 6),
    turret.accentMat, -0.32, 1.65, -0.15
  );
  turret.addHiddenPart(
    'drone_rack',
    new THREE.BoxGeometry(0.48, 0.16, 0.36),
    turret.accentMat, -0.28, 1.15, -0.25
  );

  turret.muzzleHeight = 0.52;
  turret.muzzleForward = 0.82;
}
