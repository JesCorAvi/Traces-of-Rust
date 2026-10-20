// Modelo 3D de la torreta mortar: artillería pesada inclinada con calcomanías y retroceso.
// Exports: buildMortarModel.

import * as THREE from 'three';

export function buildMortarModel(turret) {
  // Cureña pesada inferior
  turret.addPart(new THREE.BoxGeometry(0.82, 0.32, 0.76), turret.bodyMat, 0, 0.48, 0);

  // Placas laterales de blindaje con remaches y textura técnica
  turret.addPart(new THREE.BoxGeometry(0.08, 0.28, 0.72), turret.panelMat, -0.42, 0.48, 0);
  turret.addPart(new THREE.BoxGeometry(0.08, 0.28, 0.72), turret.panelMat, 0.42, 0.48, 0);

  // Placa de advertencia explosiva en el flanco
  const decalMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.19), turret.decalMat);
  decalMesh.position.set(-0.47, 0.5, 0.05);
  decalMesh.rotation.y = -Math.PI / 2;
  turret.modelRoot.add(decalMesh);

  // Manómetro de presión en la recámara
  const gaugeMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), turret.gaugeMat);
  gaugeMesh.position.set(0, 0.52, 0.39);
  gaugeMesh.rotation.y = Math.PI;
  turret.modelRoot.add(gaugeMesh);

  // Muñones de elevación cilíndricos a ambos lados
  turret.addPart(new THREE.CylinderGeometry(0.18, 0.18, 0.72, 8), turret.rustMat, 0, 0.72, -0.05, 0, 0, Math.PI / 2);

  // Cilindros hidráulicos de amortiguación
  turret.addPart(new THREE.CylinderGeometry(0.06, 0.06, 0.42, 6), turret.bodyMat, -0.25, 0.65, 0.16, 0.5, 0, 0);
  turret.addPart(new THREE.CylinderGeometry(0.06, 0.06, 0.42, 6), turret.bodyMat, 0.25, 0.65, 0.16, 0.5, 0, 0);

  // Tubo del cañón de mortero inclinado (~40°)
  const mortarGroup = new THREE.Group();
  mortarGroup.position.set(0, 0.72, -0.05);
  mortarGroup.rotation.x = -0.68;
  turret.modelRoot.add(mortarGroup);

  // Tubo principal
  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.21, 0.26, 1.15, 10),
    turret.darkMat
  );
  tube.position.set(0, 0.55, 0);
  mortarGroup.add(tube);

  // Anillo de refuerzo de boca con franjas de peligro hazard
  const muzzleRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.25, 0.18, 10),
    turret.hazardMat
  );
  muzzleRing.position.set(0, 1.1, 0);
  mortarGroup.add(muzzleRing);

  // Recámara reforzada
  const breech = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.3, 0.24, 8),
    turret.rustMat
  );
  breech.position.set(0, 0.06, 0);
  mortarGroup.add(breech);

  // Piezas de mejora (ocultas)
  turret.addHiddenPart(
    'cluster_tubes',
    new THREE.CylinderGeometry(0.1, 0.11, 0.75, 6),
    turret.rustMat, -0.26, 0.95, -0.2, -0.68, 0, 0
  );
  turret.addHiddenPart(
    'autoloader',
    new THREE.CylinderGeometry(0.22, 0.22, 0.55, 8),
    turret.accentMat, 0.38, 0.78, -0.08, 0, 0, Math.PI / 2
  );
  turret.addHiddenPart(
    'fuel_tanks',
    new THREE.CylinderGeometry(0.16, 0.16, 0.65, 8),
    turret.rustMat, -0.38, 0.62, 0.12, 0, 0, Math.PI / 2
  );
  turret.addHiddenPart(
    'siege_barrel',
    new THREE.CylinderGeometry(0.26, 0.32, 1.45, 10),
    turret.accentMat, 0, 1.25, -0.4, -0.68, 0, 0
  );
  turret.addHiddenPart(
    'barrage_racks',
    new THREE.BoxGeometry(0.58, 0.2, 0.52),
    turret.rustMat, 0, 0.75, 0.28
  );
  turret.addHiddenPart(
    'inferno_tanks',
    new THREE.CylinderGeometry(0.19, 0.19, 0.75, 8),
    turret.accentMat, -0.42, 0.68, 0.16, 0, 0, Math.PI / 2
  );

  turret.muzzleHeight = 1.48;
  turret.muzzleForward = 0.68;
}
