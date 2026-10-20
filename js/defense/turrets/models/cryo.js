// Modelo 3D de la torreta cryo: proyector criogénico con calcomanías, núcleo y tubos de escarcha.
// Exports: buildCryoModel.

import * as THREE from 'three';

export function buildCryoModel(turret) {
  // Chasis criogénico aislado
  turret.addPart(new THREE.CylinderGeometry(0.44, 0.48, 0.52, 8), turret.bodyMat, 0, 0.58, 0);

  // Placas de protección térmica con textura técnica
  turret.addPart(new THREE.BoxGeometry(0.06, 0.38, 0.48), turret.panelMat, -0.44, 0.62, 0);
  turret.addPart(new THREE.BoxGeometry(0.06, 0.38, 0.48), turret.panelMat, 0.44, 0.62, 0);

  // Calcomanía de peligro criogénico
  const decalMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.18), turret.decalMat);
  decalMesh.position.set(-0.48, 0.62, 0.02);
  decalMesh.rotation.y = -Math.PI / 2;
  turret.modelRoot.add(decalMesh);

  // Termómetro de temperatura bajo cero en la parte posterior
  const gaugeMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), turret.gaugeMat);
  gaugeMesh.position.set(0, 0.68, 0.45);
  gaugeMesh.rotation.y = Math.PI;
  turret.modelRoot.add(gaugeMesh);

  // Doble tanque de refrigerante en la parte trasera
  turret.addPart(new THREE.CylinderGeometry(0.13, 0.13, 0.58, 8), turret.rustMat, -0.22, 0.88, 0.26);
  turret.addPart(new THREE.CylinderGeometry(0.13, 0.13, 0.58, 8), turret.rustMat, 0.22, 0.88, 0.26);

  // Cámara de compresión intermedia
  turret.addPart(new THREE.CylinderGeometry(0.32, 0.36, 0.44, 8), turret.darkMat, 0, 0.96, -0.05);

  // Bocina / proyector criogénico acampanado apuntando hacia el frente
  const horn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.15, 0.52, 10),
    turret.accentMat
  );
  horn.rotation.x = Math.PI / 2;
  horn.position.set(0, 1.05, -0.42);
  turret.modelRoot.add(horn);

  // Núcleo criogénico luminoso interior
  const coreMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), turret.glowMat);
  coreMesh.position.set(0, 1.05, -0.38);
  turret.modelRoot.add(coreMesh);

  // Anillo de peligro en el borde del proyector
  const hornRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.03, 6, 16),
    turret.hazardMat
  );
  hornRing.position.set(0, 1.05, -0.68);
  turret.modelRoot.add(hornRing);

  // Piezas de mejora (ocultas)
  turret.addHiddenPart(
    'frost_coils',
    new THREE.TorusGeometry(0.36, 0.045, 6, 16),
    turret.glowMat, 0, 1.05, -0.15, 0, 0, 0
  );
  turret.addHiddenPart(
    'radiator_fins',
    new THREE.BoxGeometry(0.78, 0.46, 0.08),
    turret.rustMat, 0, 1.02, 0.36
  );
  turret.addHiddenPart(
    'crystal_core',
    new THREE.IcosahedronGeometry(0.24, 0),
    turret.glowMat, 0, 1.05, -0.45
  );
  turret.addHiddenPart(
    'ice_spikes',
    new THREE.ConeGeometry(0.12, 0.55, 6),
    turret.glowMat, 0.36, 1.15, -0.22, 0, 0, -0.4
  );
  turret.addHiddenPart(
    'shatter_crystal',
    new THREE.OctahedronGeometry(0.32, 0),
    turret.glowMat, 0, 1.45, 0
  );
  turret.addHiddenPart(
    'blizzard_core',
    new THREE.TorusGeometry(0.55, 0.065, 6, 20),
    turret.glowMat, 0, 1.05, -0.42, 0, 0, 0
  );

  turret.muzzleHeight = 1.05;
  turret.muzzleForward = 0.75;
}
